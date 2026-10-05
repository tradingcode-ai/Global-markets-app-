import React, { useEffect, useMemo, useState, useRef, Suspense } from 'react';
import { motion } from 'motion/react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Center, Environment, PerspectiveCamera, Float, ContactShadows, Image } from '@react-three/drei';
import { SVGLoader } from 'three-stdlib';
import { getLoadingAsset } from './logoLoadingManifest';

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

  const meshesData = useMemo(() => {
    return svg.paths.map((path) => {
      const color = path.color || (path.userData?.style?.fill) || '#0f172a';
      const material = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      });
      const shapes = SVGLoader.createShapes(path as any);
      const geometries = shapes.map((shape) => {
        return new THREE.ExtrudeGeometry(shape, {
          depth: 10,
          bevelEnabled: true,
          bevelThickness: 1.5,
          bevelSize: 0.5,
          bevelSegments: 3,
        });
      });
      return geometries.map(geom => ({ geometry: geom, material }));
    }).flat();
  }, [svg]);

  useEffect(() => {
    return () => {
      meshesData.forEach(({ geometry, material }) => {
        geometry.dispose();
        material.dispose();
      });
    };
  }, [meshesData]);

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
          {meshesData.map(({ geometry, material }, index) => (
            <mesh key={index} geometry={geometry} material={material} castShadow receiveShadow />
          ))}
        </group>
      </Center>
    </Float>
  );
}

// --------------------------------------------------------
// Static Fallback Component
// --------------------------------------------------------
function StaticFallback({ url }: { url: string }) {
  return (
    <Center>
      <Image url={url} transparent opacity={1} scale={3} />
    </Center>
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

  const asset = useMemo(() => getLoadingAsset(ticker), [ticker]);
  
  let currentSrc: string | null = null;
  let srcType: 'svg' | 'raster' | null = null;

  if (asset && !iconFailed && rasterAttempt === 0) {
    currentSrc = asset.src;
    srcType = asset.type;
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
              {currentSrc && srcType === 'raster' && <StaticFallback url={currentSrc} />}
            </Suspense>
          </ErrorBoundary>

          <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        </Canvas>
      </div>
    </motion.div>
  );
};
