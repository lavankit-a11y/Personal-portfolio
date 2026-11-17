import { useMemo, type CSSProperties } from "react";

/**
 * SVG feTurbulence noise used as a CSS mask. The visible color and strength
 * come from theme tokens (--noise-color, --noise-opacity), so it adapts to
 * light and dark mode automatically.
 */
function buildNoiseMask(size: number, grain: number, octaves: number, seed: number, contrast: number) {
  // Alpha = contrast × noise, pivoted at 0.5 so contrast does not shift brightness.
  const offset = (-(contrast - 1) / 2).toFixed(3);
  // The tile is generated at its display size, so the grain is never stretched or blurred.
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>` +
    `<filter id='n' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${grain}' numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch'/>` +
    `<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${contrast} 0 0 0 ${offset}'/>` +
    `</filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function NoiseTexture({
  size = 220,
  grain = 0.9,
  octaves = 3,
  contrast = 1.6,
  seed = 9,
  className = "",
}: {
  size?: number;
  grain?: number;
  octaves?: number;
  contrast?: number;
  seed?: number;
  className?: string;
}) {
  const mask = useMemo(
    () => buildNoiseMask(size, grain, octaves, seed, contrast),
    [size, grain, octaves, seed, contrast],
  );
  const style: CSSProperties = {
    backgroundColor: "var(--noise-color)",
    opacity: "var(--noise-opacity)",
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskSize: `${size}px ${size}px`,
    maskSize: `${size}px ${size}px`,
    WebkitMaskRepeat: "repeat",
    maskRepeat: "repeat",
  };

  // Opacity lives on the inner layer: page entrance animations fade the outer
  // wrapper to full opacity and must not override the texture's strength.
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 z-0 ${className}`}>
      <div className="absolute inset-0" style={style} />
    </div>
  );
}
