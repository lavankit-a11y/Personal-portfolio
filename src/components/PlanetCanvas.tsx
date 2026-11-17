import { useEffect, useRef } from "react";
import { DitherEngine } from "../intro/dither/engine";
import type { PlanetKind } from "../intro/dither/objects";

/**
 * A dithered planet using the loader's renderer, embedded inline with a softer
 * palette. The canvas is transparent and fills its parent; `fast` eases the
 * rotation up (card hover). Rendering pauses while it is off screen.
 */
export function PlanetCanvas({
  planet,
  fast = false,
  className = "",
}: {
  planet: PlanetKind;
  fast?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DitherEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new DitherEngine(canvas, { object: planet, soft: true });
    engineRef.current = engine;
    engine.start();
    const resize = new ResizeObserver(() => engine.resize());
    resize.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => engine.setActive(entry.isIntersecting), {
      rootMargin: "120px",
    });
    visibility.observe(canvas);
    return () => {
      resize.disconnect();
      visibility.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
    // The planet is fixed per card; the engine is created once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setSpeed(fast ? 2.6 : 1);
  }, [fast]);

  return <canvas ref={canvasRef} aria-hidden className={`block size-full ${className}`} />;
}
