import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { getLoadingAsset } from './logoLoadingManifest';
import { OFFICIAL_DOMAINS } from './StockLogo';

interface StockLogoLoaderProps {
  ticker: string;
  onComplete?: () => void;
  className?: string;
}

// --------------------------------------------------------
// CSS 3D Extruded Layers Definition
// Multi-layer Z-stacking with depth brightness grading
// preserves holes, separate parts, and authentic contours
// without any square card, plane, or bounding box.
// --------------------------------------------------------
const EXTRUSION_LAYERS = [
  { z: -6.0, brightness: 0.68, opacity: 0.95 },
  { z: -4.5, brightness: 0.73, opacity: 0.98 },
  { z: -3.0, brightness: 0.78, opacity: 1.0 },
  { z: -1.5, brightness: 0.83, opacity: 1.0 },
  { z: 0.0, brightness: 0.88, opacity: 1.0 },
  { z: 1.5, brightness: 0.92, opacity: 1.0 },
  { z: 3.0, brightness: 0.95, opacity: 1.0 },
  { z: 4.5, brightness: 0.98, opacity: 1.0 },
  { z: 6.0, brightness: 1.0, opacity: 1.0 },
];

// --------------------------------------------------------
// 3D SVG Extruded Silhouette Component (Hardware Accelerated)
// --------------------------------------------------------
function SvgLogo3D({
  url,
  ticker,
  onError,
  shouldReduceMotion,
}: {
  url: string;
  ticker: string;
  onError: () => void;
  shouldReduceMotion: boolean | null;
}) {
  return (
    <div
      className="relative flex flex-col items-center justify-center w-full h-full select-none"
      style={{
        perspective: '1000px',
        perspectiveOrigin: 'center center',
      }}
    >
      {/* 3D Hardware-Accelerated Extrusion Group */}
      <motion.div
        className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        animate={
          shouldReduceMotion
            ? { rotateY: 0, rotateX: 0, y: 0 }
            : {
                rotateY: [0, 360],
                rotateX: [-8, 8, -8],
                y: [-6, 6, -6],
              }
        }
        transition={{
          rotateY: {
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          },
          rotateX: {
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          y: {
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        {EXTRUSION_LAYERS.map((layer, index) => {
          const isFront = index === EXTRUSION_LAYERS.length - 1;
          return (
            <img
              key={index}
              src={url}
              alt={isFront ? `${ticker} logo` : ''}
              aria-hidden={!isFront}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
              loading="eager"
              decoding="sync"
              style={{
                transform: `translateZ(${layer.z}px)`,
                filter: isFront
                  ? 'brightness(1.0) drop-shadow(0 2px 5px rgba(0,0,0,0.08))'
                  : `brightness(${layer.brightness})`,
                opacity: layer.opacity,
                willChange: 'transform',
              }}
              onError={index === 0 ? onError : undefined}
            />
          );
        })}
      </motion.div>

      {/* Dynamic Floor Contact Shadow */}
      <motion.div
        className="w-24 h-3.5 rounded-[50%] bg-slate-900/15 blur-sm mt-8 pointer-events-none"
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? { opacity: 0.2, scale: 1 }
            : {
                opacity: [0.15, 0.28, 0.15],
                scale: [0.85, 1.1, 0.85],
              }
        }
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Ticker Indicator */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase select-none">
        <span>{ticker}</span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
      </div>
    </div>
  );
}

// --------------------------------------------------------
// Strictly Static Fallback Components (per AGENTS.md invariant)
// Never animated, never rotated, no rotating cards or boxes.
// --------------------------------------------------------
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
      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase select-none">
        <span>{ticker}</span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
      </div>
    </div>
  );
}

function StaticBadgeFallback({ ticker }: { ticker: string }) {
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-center text-white font-bold text-2xl tracking-wider select-none">
        {ticker.slice(0, 4)}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase select-none">
        <span>{ticker}</span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
      </div>
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
  const shouldReduceMotion = useReducedMotion();

  const [svgFailed, setSvgFailed] = useState(false);
  const [rasterAttempt, setRasterAttempt] = useState(0);

  // Exactly 1.5 seconds completion callback with cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

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

  // Determine active render mode
  const isSvgCandidate = asset?.type === 'svg' && !svgFailed;
  const svgUrl = isSvgCandidate ? asset.src : null;

  const isRasterCandidate =
    !isSvgCandidate &&
    ((asset?.type === 'raster' && rasterAttempt === 0 ? asset.src : fallbackRasterUrl) !== null);

  const rasterUrl = isRasterCandidate
    ? (asset?.type === 'raster' && rasterAttempt === 0 ? asset.src : fallbackRasterUrl)
    : null;

  return (
    <motion.div
      key={`stock-logo-loader-${cleanTicker}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.99, transition: { duration: 0.25, ease: 'easeInOut' } }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-white rounded-[inherit] overflow-hidden select-none pointer-events-auto ${className}`}
    >
      {svgUrl ? (
        <SvgLogo3D
          url={svgUrl}
          ticker={cleanTicker}
          onError={() => setSvgFailed(true)}
          shouldReduceMotion={shouldReduceMotion}
        />
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
