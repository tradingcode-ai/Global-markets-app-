import React, { useEffect, useMemo, useState, useRef, Suspense } from 'react';
import { motion } from 'motion/react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Center, Environment, PerspectiveCamera, Float, ContactShadows, useTexture } from '@react-three/drei';
import { SVGLoader } from 'three-stdlib';
import { BRAND_ICONS, OFFICIAL_DOMAINS, OFFICIAL_FAVICON_FIRST, SIMPLE_ICONS_VERSION } from './StockLogo';

interface StockLogoLoaderProps {
  ticker: string;
  onComplete?: () => void;
  className?: string;
}

class ErrorBoundary extends React.Component<{ fallback: React.ReactNode; onError?: () => void; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    if (this.props.onError) this.props.onError();
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}


// --------------------------------------------------------
// 3D SVG Geometry Loader Component
// --------------------------------------------------------
function SvgLogo3D({ url }: { url: string }) {
  const svg = useLoader(SVGLoader, url);
  const groupRef = useRef<THREE.Group>(null);
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#0f172a', // Deep slate for corporate feel
    metalness: 0.8,
    roughness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  }), []);

  const geometries = useMemo(() => {
    return svg.paths.map((path) => {
      // Type assertion needed due to slightly mismatched types in three-stdlib
      const shapes = SVGLoader.createShapes(path as any);
      return shapes.map((shape) => {
        return new THREE.ExtrudeGeometry(shape, {
          depth: 10,
          bevelEnabled: true,
          bevelThickness: 1.5,
          bevelSize: 0.5,
          bevelSegments: 3,
        });
      });
    }).flat();
  }, [svg]);

  // Assembly animation: pieces float in and assemble
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      // Gently rotate the whole group
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
      groupRef.current.rotation.x = Math.cos(t * 0.5) * 0.1;
    }
  });

  return (
    <Float floatIntensity={1.5} rotationIntensity={0.5} speed={2}>
      <Center>
        <group ref={groupRef} scale={[0.1, -0.1, 0.1]}>
          {geometries.map((geom, index) => (
            <mesh key={index} geometry={geom} material={material} castShadow receiveShadow />
          ))}
        </group>
      </Center>
    </Float>
  );
}

// --------------------------------------------------------
// 3D Raster Texture Loader Component (Favicon Fallback)
// --------------------------------------------------------
function RasterBox({ url }: { url: string }) {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  const meshRef = useRef<THREE.Mesh>(null);
  
  const frontMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    map: texture,
    metalness: 0.1,
    roughness: 0.2,
    clearcoat: 0.8,
  }), [texture]);
  
  const sideMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#e2e8f0',
    metalness: 0.5,
    roughness: 0.2,
  }), []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.elapsedTime;
      // Elegant entrance spin then settle into slow rotation
      const entrance = Math.min(t * 2, 1); // 0 to 1 over 0.5s
      meshRef.current.rotation.y = (1 - entrance) * Math.PI * 4 + t * 0.5; 
      meshRef.current.position.y = Math.sin(t * 2) * 0.1;
    }
  });

  return (
    <Float floatIntensity={1} rotationIntensity={0.2} speed={2}>
      <mesh ref={meshRef} castShadow receiveShadow material={[sideMaterial, sideMaterial, sideMaterial, sideMaterial, frontMaterial, frontMaterial]}>
        <boxGeometry args={[2.5, 2.5, 0.25]} />
      </mesh>
    </Float>
  );
}

// --------------------------------------------------------
// Main Component
// --------------------------------------------------------
export const StockLogoLoader: React.FC<StockLogoLoaderProps> = ({
  ticker,
  onComplete,
  className = '',
}) => {
  const cleanTicker = ticker ? ticker.toUpperCase().trim() : '';
  
  const [iconFailed, setIconFailed] = useState(false);
  const [rasterAttempt, setRasterAttempt] = useState(0);

  useEffect(() => {
    // Exactly 1.5 seconds completion
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Determine Logo URLs
  const iconUrl = useMemo(() => {
    const slug = BRAND_ICONS[cleanTicker];
    return slug
      ? `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS_VERSION}/icons/${slug}.svg`
      : null;
  }, [cleanTicker]);

  const domain = OFFICIAL_DOMAINS[cleanTicker];
  const faviconUrl = useMemo(() => {
    if (!domain) return null;
    if (rasterAttempt === 0) return `https://logo.clearbit.com/${domain}`;
    if (rasterAttempt === 1) return `https://icon.horse/icon/${domain}`;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }, [domain, rasterAttempt]);

  const faviconFailed = rasterAttempt > 2;

  const preferOfficial = OFFICIAL_FAVICON_FIRST.has(cleanTicker);
  let currentSrc: string | null = null;
  let srcType: 'svg' | 'raster' | null = null;

  if (preferOfficial) {
    if (faviconUrl && !faviconFailed) { currentSrc = faviconUrl; srcType = 'raster'; }
    else if (iconUrl && !iconFailed) { currentSrc = iconUrl; srcType = 'svg'; }
  } else {
    if (iconUrl && !iconFailed) { currentSrc = iconUrl; srcType = 'svg'; }
    else if (faviconUrl && !faviconFailed) { currentSrc = faviconUrl; srcType = 'raster'; }
  }

  return (
    <motion.div
      key="stock-logo-loader-3d"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.99, transition: { duration: 0.25, ease: 'easeInOut' } }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-white rounded-[inherit] overflow-hidden select-none pointer-events-auto ${className}`}
    >
      <div className="absolute inset-0 w-full h-full">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={40} />
          <color attach="background" args={['#ffffff']} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          <Environment preset="city" />
          
          <ErrorBoundary fallback={null} onError={() => srcType === 'svg' ? setIconFailed(true) : setRasterAttempt(prev => prev + 1)}>
            <Suspense fallback={null}>
              {currentSrc && srcType === 'svg' && <SvgLogo3D url={currentSrc} />}
              {currentSrc && srcType === 'raster' && <RasterBox url={currentSrc} />}
            </Suspense>
          </ErrorBoundary>

          <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        </Canvas>
      </div>
    </motion.div>
  );
};
