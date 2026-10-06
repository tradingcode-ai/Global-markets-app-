import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three-stdlib';
import { getLoadingAsset } from './logoLoadingManifest';
import { OFFICIAL_DOMAINS } from './StockLogo';

interface StockLogoLoaderProps {
  ticker: string;
  onComplete?: () => void;
  className?: string;
}

// --------------------------------------------------------
// Timing
// --------------------------------------------------------
/** onComplete fires exactly this many ms after mount. */
const LOADER_DURATION_MS = 2000;
/** Overlay exit fade (runs after onComplete via AnimatePresence). */
const EXIT_DURATION_S = 0.18;
/** Length of the assembly timeline (s); leaves headroom before onComplete. */
const TIMELINE_S = 1.8;
/** If the SVG arrives later than this (s after mount), skip to the settled pose. */
const MAX_LATE_START_S = 0.9;

// --------------------------------------------------------
// Geometry tuning (world units; camera fov 35 at z ≈ 8)
// --------------------------------------------------------
const FIT_WIDTH = 3.2;
const FIT_HEIGHT = 2.2;
const EXTRUDE_DEPTH = 0.24;
const BEVEL_THICKNESS = 0.03;
const BEVEL_SIZE = 0.012;
const PARTICLE_COUNT = 720;
const PARTICLE_RADIUS = 0.034;

// --------------------------------------------------------
// SVG source cache: text only (no GPU resources), so it is safe to share
// between mounts and makes repeated opens start instantly.
// --------------------------------------------------------
const svgTextCache = new Map<string, Promise<string>>();

function fetchSvgText(url: string): Promise<string> {
  let pending = svgTextCache.get(url);
  if (!pending) {
    pending = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res.text();
    });
    pending.catch(() => svgTextCache.delete(url));
    svgTextCache.set(url, pending);
  }
  return pending;
}

// --------------------------------------------------------
// Logo model: real SVG contours → extruded, bevelled geometry + particle targets
// --------------------------------------------------------
interface LogoPart {
  geometry: THREE.ExtrudeGeometry;
  color: THREE.Color;
}

interface LogoModel {
  parts: LogoPart[];
  /** Particle target positions (SVG units, centred). */
  targets: Float32Array;
  /** Particle colours (linear RGB). */
  colors: Float32Array;
  /** Logo bounds in SVG units. */
  width: number;
  height: number;
  /** World units per SVG unit for the fitted logo. */
  baseScale: number;
  dispose: () => void;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Deterministic PRNG so every open of the same ticker assembles identically. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Keep near-white fills visible on the white overlay without changing hue. */
function legibleColor(color: THREE.Color) {
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  if (hsl.l > 0.9) color.setHSL(hsl.h, hsl.s, 0.82);
  return color;
}

function buildLogoModel(svgText: string, brandColor: string | undefined, seedKey: string): LogoModel {
  const data = new SVGLoader().parse(svgText);
  const brand = brandColor ? new THREE.Color(brandColor) : null;

  const rawParts: { shapes: THREE.Shape[]; color: THREE.Color }[] = [];
  for (const path of data.paths) {
    const style = (path.userData?.style ?? {}) as Record<string, unknown>;
    if (style.fill === 'none' || style.fillOpacity === 0 || style.visibility === 'hidden') continue;
    const shapes = SVGLoader.createShapes(path as unknown as Parameters<typeof SVGLoader.createShapes>[0]);
    if (!shapes.length) continue;
    // Single-colour sources (Simple Icons) carry no fill: apply the recorded brand hex.
    const color = legibleColor(brand ? brand.clone() : path.color.clone());
    rawParts.push({ shapes, color });
  }
  if (!rawParts.length) throw new Error('SVG contains no fillable shapes');

  // Measured bounds of the actual contours
  const bounds = new THREE.Box2();
  for (const part of rawParts) {
    for (const shape of part.shapes) {
      for (const p of shape.getPoints(6)) bounds.expandByPoint(p);
    }
  }
  const size = bounds.getSize(new THREE.Vector2());
  const center = bounds.getCenter(new THREE.Vector2());
  if (!(size.x > 0 && size.y > 0) || !Number.isFinite(size.x + size.y)) {
    throw new Error('SVG has degenerate bounds');
  }

  const baseScale = Math.min(FIT_WIDTH / size.x, FIT_HEIGHT / size.y);
  const depth = EXTRUDE_DEPTH / baseScale;

  const parts: LogoPart[] = rawParts.map(({ shapes, color }) => {
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: BEVEL_THICKNESS / baseScale,
      bevelSize: BEVEL_SIZE / baseScale,
      bevelSegments: 3,
    });
    geometry.translate(-center.x, -center.y, -depth / 2);
    geometry.computeVertexNormals();
    return { geometry, color };
  });

  // ---- Particle targets: ~60% on contours (incl. holes), ~40% inside the fill ----
  const rand = mulberry32(hashString(seedKey));
  const frontZ = depth / 2 + BEVEL_THICKNESS / baseScale;
  const targets: number[] = [];
  const colors: number[] = [];

  const contours: { path: THREE.Path; length: number; color: THREE.Color }[] = [];
  const triangles: { a: THREE.Vector2; b: THREE.Vector2; c: THREE.Vector2; area: number; color: THREE.Color }[] = [];
  for (const { shapes, color } of rawParts) {
    for (const shape of shapes) {
      contours.push({ path: shape, length: shape.getLength(), color });
      for (const hole of shape.holes) contours.push({ path: hole, length: hole.getLength(), color });

      const extracted = shape.extractPoints(6);
      const verts = [extracted.shape, ...extracted.holes].flat();
      for (const [i0, i1, i2] of THREE.ShapeUtils.triangulateShape(extracted.shape, extracted.holes)) {
        const a = verts[i0];
        const b = verts[i1];
        const c = verts[i2];
        const area = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
        if (area > 0) triangles.push({ a, b, c, area, color });
      }
    }
  }

  const contourBudget = Math.round(PARTICLE_COUNT * 0.6);
  const totalLength = contours.reduce((sum, c) => sum + c.length, 0) || 1;
  for (const contour of contours) {
    const n = Math.max(3, Math.round((contourBudget * contour.length) / totalLength));
    const pts = contour.path.getSpacedPoints(n);
    for (let i = 0; i < n; i++) {
      targets.push(pts[i].x - center.x, pts[i].y - center.y, frontZ);
      colors.push(contour.color.r, contour.color.g, contour.color.b);
    }
  }

  const fillBudget = Math.max(0, PARTICLE_COUNT - targets.length / 3);
  const totalArea = triangles.reduce((sum, t) => sum + t.area, 0);
  if (totalArea > 0) {
    for (let i = 0; i < fillBudget; i++) {
      let pick = rand() * totalArea;
      let tri = triangles[0];
      for (const t of triangles) {
        pick -= t.area;
        if (pick <= 0) {
          tri = t;
          break;
        }
      }
      let u = rand();
      let v = rand();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const x = tri.a.x + u * (tri.b.x - tri.a.x) + v * (tri.c.x - tri.a.x);
      const y = tri.a.y + u * (tri.b.y - tri.a.y) + v * (tri.c.y - tri.a.y);
      targets.push(x - center.x, y - center.y, frontZ);
      colors.push(tri.color.r, tri.color.g, tri.color.b);
    }
  }

  return {
    parts,
    targets: new Float32Array(targets),
    colors: new Float32Array(colors),
    width: size.x,
    height: size.y,
    baseScale,
    dispose: () => parts.forEach((p) => p.geometry.dispose()),
  };
}

// --------------------------------------------------------
// Three.js scene: particles fly in from depth, converge on the contour,
// the solid extrusion grows out of them, a light sheen passes, spring settle.
// --------------------------------------------------------
function AssemblyScene({
  model,
  seedKey,
  startAt,
  reducedMotion,
}: {
  model: LogoModel;
  seedKey: string;
  /** Seconds between mount and model readiness (used to compress late starts). */
  startAt: number;
  reducedMotion: boolean;
}) {
  const { viewport, camera, invalidate } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const solidRef = useRef<THREE.Group>(null);
  const sheenRef = useRef<THREE.PointLight>(null);

  const skipAnimation = reducedMotion || startAt > MAX_LATE_START_S;
  const speed = skipAnimation ? 1 : TIMELINE_S / Math.max(TIMELINE_S - startAt, TIMELINE_S - MAX_LATE_START_S);
  const timeRef = useRef(skipAnimation ? TIMELINE_S : 0);

  const count = model.targets.length / 3;

  // Imperatively created GPU resources, explicitly disposed on unmount/replacement.
  const resources = useMemo(() => {
    const materials = model.parts.map(
      (part) =>
        new THREE.MeshStandardMaterial({
          color: part.color,
          metalness: 0.18,
          roughness: 0.34,
          transparent: !skipAnimation,
          opacity: skipAnimation ? 1 : 0,
        }),
    );

    const particleGeometry = new THREE.TetrahedronGeometry(PARTICLE_RADIUS / model.baseScale, 0);
    const particleMaterial = new THREE.MeshStandardMaterial({
      metalness: 0.3,
      roughness: 0.25,
      flatShading: true,
    });
    const particles = new THREE.InstancedMesh(particleGeometry, particleMaterial, Math.max(1, count));
    particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    particles.frustumCulled = false;
    particles.visible = !skipAnimation;

    const rand = mulberry32(hashString(`${seedKey}:flight`));
    const starts = new Float32Array(count * 3);
    const delays = new Float32Array(count);
    const spins = new Float32Array(count * 3);
    const color = new THREE.Color();
    const unit = 1 / model.baseScale; // SVG units per world unit
    for (let i = 0; i < count; i++) {
      const tx = model.targets[i * 3];
      const ty = model.targets[i * 3 + 1];
      const tz = model.targets[i * 3 + 2];
      starts[i * 3] = tx + (rand() - 0.5) * model.width * 1.5;
      starts[i * 3 + 1] = ty + (rand() - 0.5) * model.height * 1.5;
      starts[i * 3 + 2] = tz - (1.2 + rand() * 4.5) * unit;
      // Left-to-right sweep with jitter
      delays[i] = 0.3 * ((tx / model.width) + 0.5) + rand() * 0.15;
      spins[i * 3] = (rand() - 0.5) * 9;
      spins[i * 3 + 1] = (rand() - 0.5) * 9;
      spins[i * 3 + 2] = (rand() - 0.5) * 9;
      color.setRGB(model.colors[i * 3], model.colors[i * 3 + 1], model.colors[i * 3 + 2]);
      color.lerp(new THREE.Color(1, 1, 1), 0.15);
      particles.setColorAt(i, color);
    }
    if (particles.instanceColor) particles.instanceColor.needsUpdate = true;

    return { materials, particleGeometry, particleMaterial, particles, starts, delays, spins };
  }, [model, seedKey, count, skipAnimation]);

  useEffect(
    () => () => {
      resources.materials.forEach((m) => m.dispose());
      resources.particles.dispose();
      resources.particleGeometry.dispose();
      resources.particleMaterial.dispose();
    },
    [resources],
  );

  // Responsive fit: never wider than ~70% of the viewport
  const fit = Math.min(1, (viewport.width * 0.7) / (model.width * model.baseScale));
  const worldScale = model.baseScale * fit;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const solid = solidRef.current;
    if (!group || !solid) return;

    if (!skipAnimation) timeRef.current = Math.min(TIMELINE_S + 0.2, timeRef.current + Math.min(delta, 0.05) * speed);
    const u = timeRef.current;

    // ---- Particles: depth flight → contour convergence → dissolve into the solid ----
    const { particles, starts, delays, spins } = resources;
    const dissolve = 1 - smoothstep(1.05, 1.45, u);
    particles.visible = !skipAnimation && dissolve > 0.001;
    if (particles.visible) {
      for (let i = 0; i < count; i++) {
        const p = clamp01((u - delays[i]) / 0.7);
        const e = easeOutCubic(p);
        const k = 1 - e;
        dummy.position.set(
          starts[i * 3] + (model.targets[i * 3] - starts[i * 3]) * e,
          starts[i * 3 + 1] + (model.targets[i * 3 + 1] - starts[i * 3 + 1]) * e,
          starts[i * 3 + 2] + (model.targets[i * 3 + 2] - starts[i * 3 + 2]) * e,
        );
        dummy.rotation.set(spins[i * 3] * k, spins[i * 3 + 1] * k, spins[i * 3 + 2] * k);
        dummy.scale.setScalar(Math.max(0.0001, clamp01(p * 4) * dissolve));
        dummy.updateMatrix();
        particles.setMatrixAt(i, dummy.matrix);
      }
      particles.instanceMatrix.needsUpdate = true;
    }

    // ---- Solid extrusion grows out of the particle plane ----
    const reveal = smoothstep(0.85, 1.35, u);
    solid.scale.z = Math.max(0.001, easeOutCubic(reveal));
    for (const m of resources.materials) {
      m.opacity = reveal;
      const opaque = reveal >= 1;
      if (m.transparent === opaque) {
        m.transparent = !opaque;
        m.needsUpdate = true;
      }
    }

    // ---- Damped-spring settle (rotation + subtle scale) ----
    const damp = Math.exp(-2.4 * u);
    group.rotation.y = -0.62 * damp * Math.cos(3.3 * u);
    group.rotation.x = 0.22 * damp * Math.cos(3.3 * u + 0.3);
    const landing = u > 1.3 ? 0.035 * Math.exp(-7 * (u - 1.3)) * Math.sin(9 * (u - 1.3)) : 0;
    const s = worldScale * (1 + landing);
    // Negative Y flips SVG (y-down) into world (y-up); three.js corrects face winding.
    group.scale.set(s, -s, s);

    // ---- Light sheen sweep once the logo is solid ----
    if (sheenRef.current) {
      const sweep = clamp01((u - 1.15) / 0.6);
      sheenRef.current.position.x = -5 + 10 * smoothstep(0, 1, sweep);
      sheenRef.current.intensity = skipAnimation ? 0 : 22 * Math.sin(Math.PI * sweep);
    }

    // ---- Gentle camera dolly ----
    camera.position.z = 8.6 - 0.6 * easeOutCubic(clamp01(u / 1.6));
  });

  // Reduced motion / late start: render the settled pose once.
  useEffect(() => {
    if (skipAnimation) invalidate();
  }, [skipAnimation, invalidate, worldScale]);

  return (
    <>
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#ffffff', '#cbd5e1', 0.8]} />
      <directionalLight position={[3, 4, 6]} intensity={2.6} />
      <directionalLight position={[-5, -2, 4]} intensity={0.8} />
      <pointLight ref={sheenRef} position={[-5, 1.2, 3]} intensity={0} distance={0} decay={2} />
      <group ref={groupRef}>
        <group ref={solidRef}>
          {model.parts.map((part, i) => (
            <mesh key={i} geometry={part.geometry} material={resources.materials[i]} dispose={null} />
          ))}
        </group>
        <primitive object={resources.particles} dispose={null} />
      </group>
    </>
  );
}

// --------------------------------------------------------
// Error boundary around WebGL: any render failure → static (non-animated) logo
// --------------------------------------------------------
class WebGLErrorBoundary extends Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function TickerIndicator({ ticker }: { ticker: string }) {
  return (
    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase select-none">
      <span>{ticker}</span>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
    </div>
  );
}

// --------------------------------------------------------
// 3D logo assembly (vector sources only)
// --------------------------------------------------------
function LogoAssembly3D({
  url,
  color,
  ticker,
  mountedAt,
  reducedMotion,
  onFetchError,
  onRenderError,
}: {
  url: string;
  color?: string;
  ticker: string;
  mountedAt: number;
  reducedMotion: boolean;
  onFetchError: () => void;
  onRenderError: () => void;
}) {
  const [ready, setReady] = useState<{ model: LogoModel; startAt: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let built: LogoModel | null = null;
    fetchSvgText(url)
      .then((text) => {
        if (cancelled) return;
        try {
          built = buildLogoModel(text, color, `${ticker}:${url}`);
        } catch {
          onRenderError();
          return;
        }
        setReady({ model: built, startAt: (performance.now() - mountedAt) / 1000 });
      })
      .catch(() => {
        if (!cancelled) onFetchError();
      });
    return () => {
      cancelled = true;
      built?.dispose();
      setReady(null);
    };
    // Callbacks are intentionally excluded: they are recreated per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, color, ticker, mountedAt]);

  return (
    <div className="flex flex-col items-center justify-center w-full select-none">
      <div className="relative w-full max-w-[520px] h-[220px] sm:h-[260px]">
        {ready && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0.9 : 0.15, ease: 'easeOut' }}
          >
            <WebGLErrorBoundary onError={onRenderError}>
              <Canvas
                flat
                dpr={[1, 2]}
                frameloop={reducedMotion || ready.startAt > MAX_LATE_START_S ? 'demand' : 'always'}
                camera={{ position: [0, 0, 8.6], fov: 35, near: 0.1, far: 50 }}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                style={{ pointerEvents: 'none' }}
                aria-hidden="true"
              >
                <AssemblyScene
                  model={ready.model}
                  seedKey={`${ticker}:${url}`}
                  startAt={ready.startAt}
                  reducedMotion={reducedMotion}
                />
              </Canvas>
            </WebGLErrorBoundary>
          </motion.div>
        )}
      </div>
      <span className="sr-only">{`${ticker} logo`}</span>
      <TickerIndicator ticker={ticker} />
    </div>
  );
}

// --------------------------------------------------------
// Strictly Static Fallback Components (per AGENTS.md invariant)
// Never animated, never rotated, no rotating cards or boxes.
// --------------------------------------------------------
function StaticVectorFallback({ src, ticker, onError }: { src: string; ticker: string; onError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <img
        src={src}
        alt={`${ticker} logo`}
        className="w-28 h-28 object-contain"
        loading="eager"
        decoding="async"
        onError={onError}
      />
      <TickerIndicator ticker={ticker} />
    </div>
  );
}

function StaticRasterFallback({
  src,
  ticker,
  onError,
}: {
  src: string;
  ticker: string;
  onError: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-3">
        <img
          src={src}
          alt={`${ticker} logo`}
          className="w-full h-full object-contain"
          loading="eager"
          decoding="sync"
          onError={onError}
        />
      </div>
      <TickerIndicator ticker={ticker} />
    </div>
  );
}

function StaticBadgeFallback({ ticker }: { ticker: string }) {
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-center text-white font-bold text-2xl tracking-wider select-none">
        {ticker.slice(0, 4)}
      </div>
      <TickerIndicator ticker={ticker} />
    </div>
  );
}

// --------------------------------------------------------
// Main StockLogoLoader Component
// --------------------------------------------------------
export const StockLogoLoader: React.FC<StockLogoLoaderProps> = ({
  ticker,
  onComplete,
  className = '',
}) => {
  const cleanTicker = ticker ? ticker.toUpperCase().trim() : '';
  const reducedMotion = useReducedMotion() ?? false;

  const [mountedAt] = useState(() => performance.now());
  const [svgMode, setSvgMode] = useState<'3d' | 'static' | 'failed'>('3d');
  const [rasterAttempt, setRasterAttempt] = useState(0);

  // Exactly 2.0 s completion callback. The latest callback is kept in a ref so
  // parent re-renders (inline arrow props) never restart the timer.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    const timer = setTimeout(() => onCompleteRef.current?.(), LOADER_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // Asset resolution from loading manifest
  const asset = useMemo(() => getLoadingAsset(cleanTicker), [cleanTicker]);
  const domain = OFFICIAL_DOMAINS[cleanTicker];

  // Raster fallback URLs sequence
  const fallbackRasterUrl = useMemo(() => {
    if (!domain) return null;
    if (rasterAttempt === 0) return `https://icon.horse/icon/${domain}`;
    if (rasterAttempt === 1) return `https://logo.clearbit.com/${domain}`;
    if (rasterAttempt === 2) return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    return null;
  }, [domain, rasterAttempt]);

  const svgUrl = asset?.type === 'svg' && svgMode !== 'failed' ? asset.src : null;
  const rasterUrl = svgUrl ? null : fallbackRasterUrl;

  return (
    <motion.div
      key={`stock-logo-loader-${cleanTicker}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: EXIT_DURATION_S, ease: 'easeOut' } }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-white rounded-[inherit] overflow-hidden select-none pointer-events-auto ${className}`}
      role="status"
      aria-live="polite"
    >
      {svgUrl && svgMode === '3d' ? (
        <LogoAssembly3D
          url={svgUrl}
          color={asset?.color}
          ticker={cleanTicker}
          mountedAt={mountedAt}
          reducedMotion={reducedMotion}
          onFetchError={() => setSvgMode('failed')}
          onRenderError={() => setSvgMode('static')}
        />
      ) : svgUrl ? (
        <StaticVectorFallback src={svgUrl} ticker={cleanTicker} onError={() => setSvgMode('failed')} />
      ) : rasterUrl ? (
        <StaticRasterFallback
          src={rasterUrl}
          ticker={cleanTicker}
          onError={() => setRasterAttempt((prev) => prev + 1)}
        />
      ) : (
        <StaticBadgeFallback ticker={cleanTicker} />
      )}
    </motion.div>
  );
};
