const BLOCK = 20;
const COVER_MS = 1080;
const REVEAL_MS = 1080;

/** Cubic ease-in-out: slow start, faster middle, slow finish. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let running = false;

/**
 * Mostly bottom-to-top order with random scatter, so blocks start at the
 * bottom and rise as an uneven, patchy band rather than a straight line.
 */
function thresholds(cols: number, rows: number) {
  const t = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    const fromBottom = 1 - r / Math.max(rows - 1, 1);
    for (let c = 0; c < cols; c++) t[r * cols + c] = 0.7 * (1 - fromBottom) + 0.3 * Math.random();
  }
  return t;
}

/**
 * Covers the viewport with 20px squares of the next theme's background in a
 * random order, switches the theme underneath, then removes the squares in a
 * new random order so the new theme shows through block by block.
 */
export function runPixelTransition(next: "light" | "dark", apply: () => void) {
  if (running) return;
  running = true;

  const color = getComputedStyle(document.documentElement)
    .getPropertyValue(next === "dark" ? "--page-dark" : "--page-light")
    .trim();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const cols = Math.ceil(w / BLOCK);
  const rows = Math.ceil(h / BLOCK);
  const dpr = window.devicePixelRatio || 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w * dpr);
  canvas.height = Math.ceil(h * dpr);
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: `${w}px`,
    height: `${h}px`,
    zIndex: "2147483647",
    pointerEvents: "none",
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    apply();
    running = false;
    return;
  }
  ctx.scale(dpr, dpr);
  ctx.fillStyle = color;

  const cover = thresholds(cols, rows);
  const reveal = thresholds(cols, rows);

  const draw = (visible: (i: number) => boolean) => {
    ctx.clearRect(0, 0, w, h);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (visible(r * cols + c)) ctx.fillRect(c * BLOCK, r * BLOCK, BLOCK, BLOCK);
      }
    }
  };

  const start = performance.now();
  let switched = false;
  const frame = (now: number) => {
    const elapsed = now - start;
    if (elapsed < COVER_MS) {
      const p = easeInOut(elapsed / COVER_MS);
      draw((i) => cover[i] <= p);
    } else {
      if (!switched) {
        switched = true;
        apply();
      }
      const linear = Math.min((elapsed - COVER_MS) / REVEAL_MS, 1);
      const p = easeInOut(linear);
      draw((i) => reveal[i] > p);
      if (linear >= 1) {
        canvas.remove();
        running = false;
        return;
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
