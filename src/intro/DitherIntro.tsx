import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_PARAMS, DitherEngine, type DitherParams } from "./dither/engine";

/**
 * Full-screen, auto-playing, looping 1-bit dither animation (three.js only).
 * The canvas is transparent; the stage gradient is plain CSS behind it.
 *
 * Debug keys: SPACE pause · D panel.
 */
export function DitherIntro({
  onProgress,
  onComplete,
  onReady,
}: {
  onProgress?: (p: number) => void;
  onComplete?: () => void;
  onReady?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DitherEngine | null>(null);
  const [panel, setPanel] = useState(() => new URLSearchParams(window.location.search).has("introDebug"));
  const [stats, setStats] = useState<ReturnType<DitherEngine["measure"]> | null>(null);
  const [params, setParams] = useState<DitherParams>(DEFAULT_PARAMS);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new DitherEngine(canvas, {
      onProgress,
      onComplete,
      onReady,
    });
    engineRef.current = engine;
    engine.start();

    const onResize = () => engine.resize();
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        engine.togglePause();
      } else if (e.key === "d" || e.key === "D") setPanel((v) => !v);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      engine.dispose();
      engineRef.current = null;
    };
    // Callbacks are read once at mount; the engine owns the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live measurements while the debug overlay is open.
  useEffect(() => {
    if (!panel) return;
    const read = () => engineRef.current && setStats(engineRef.current.measure());
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, [panel]);

  const update = (patch: Partial<DitherParams>) => {
    setParams((prev) => ({ ...prev, ...patch }));
    engineRef.current?.setParams(patch);
  };

  const sliders: { key: keyof DitherParams; label: string; min: number; max: number; step: number }[] = [
    { key: "cellPx", label: "Cell size px (0 = auto)", min: 0, max: 6, step: 0.25 },
    { key: "contrast", label: "Dither contrast", min: 1, max: 4, step: 0.05 },
    { key: "noiseMul", label: "Noise amplitude", min: 0, max: 2, step: 0.05 },
    { key: "lightAzimuth", label: "Light angle", min: 60, max: 240, step: 1 },
    { key: "ringParticles", label: "Ring particles", min: 0, max: 1200, step: 10 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
      {panel &&
        createPortal(
        <div
          style={{
            position: "fixed",
            zIndex: 101,
            top: 16,
            left: 16,
            padding: 12,
            width: 330,
            background: "rgba(1,1,0,0.85)",
            color: "#eeeeeb",
            font: "12px/1.4 ui-monospace, monospace",
            borderRadius: 8,
          }}
        >
          {stats && (
            <div style={{ marginBottom: 10, whiteSpace: "pre" }}>
              {`stage ${Math.round(stats.stage.w)} x ${Math.round(stats.stage.h)} px · cell ${stats.cell.toFixed(2)} px\n`}
              {`floor at ${stats.floorY.toFixed(1)}% of stage height\n`}
              {stats.objects
                .map((o) => `${o.key.padEnd(10)} ${o.width.toFixed(1)}% w · ${o.height.toFixed(1)}% h · centre ${o.centerY.toFixed(1)}%`)
                .join("\n")}
            </div>
          )}
          {sliders.map((s) => (
            <label key={s.key} style={{ display: "block", marginBottom: 8 }}>
              {s.label}: {params[s.key]}
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={params[s.key]}
                onChange={(e) => update({ [s.key]: Number(e.target.value) })}
                style={{ width: "100%" }}
              />
            </label>
          ))}
        </div>,
          document.body,
        )}
    </div>
  );
}
