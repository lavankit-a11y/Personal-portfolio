import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Tunable opening and scroll-interaction constants. */
export const FADE_START_LINE = 0.08; // 8% of viewport height
export const FADE_DISTANCE = 200; // px
export const LOAD_BLUR = 24; // px
export const LOAD_DURATION = 1.4; // seconds
export const STAGGER = 0.13; // seconds

const LOAD_DELAY = 140; // ms, within the requested 100–200ms
const LOAD_MAX_STAGGER = 440; // 140ms delay + 440ms stagger + 1.4s = 1.98s

/**
 * Site-wide interaction wrapper. It manages every outermost `[data-fade]`
 * section below it with one requestAnimationFrame-driven scroll update.
 * `display: contents` ensures the wrapper cannot alter layout.
 */
export function PageInteractions({
  children,
  playOpening = true,
  blurOpening = true,
  scrollFade = true,
}: {
  children: ReactNode;
  playOpening?: boolean;
  blurOpening?: boolean;
  scrollFade?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const all = Array.from(root.querySelectorAll<HTMLElement>("[data-fade]"));
    const sections = all.filter((node) => {
      const parent = node.parentElement?.closest("[data-fade]");
      return !parent || !root.contains(parent);
    });
    sections.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !blurOpening;
    const animations: Animation[] = [];
    if (playOpening) {
      // Animating a 24px filter on every below-the-fold section creates many
      // large compositor layers. Only blocks visible during the opening need
      // the load reveal; lower blocks remain untouched until scrolled into view.
      const openingSections = sections
        .filter((section) => {
          const rect = section.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight * 1.15;
        })
        // The first five blocks cover the full opening viewport. Capping here
        // avoids putting 24px GPU blur layers on live WebGL project canvases.
        .slice(0, 5);
      openingSections.forEach((section, index) => {
        section.style.willChange = "opacity, filter";
        const stagger = Math.min(index * STAGGER * 1000, LOAD_MAX_STAGGER);
        const animation = section.animate(
            reduced
              ? [{ opacity: 0.08 }, { opacity: 1 }]
              : [
                  { opacity: 0.08, filter: `blur(${LOAD_BLUR}px)` },
                  { opacity: 1, filter: "blur(0px)" },
                ],
            {
              duration: reduced ? 220 : LOAD_DURATION * 1000,
              delay: LOAD_DELAY + (reduced ? 0 : stagger),
              easing: reduced ? "ease-out" : "cubic-bezier(0.16, 1, 0.3, 1)",
              fill: "backwards",
            },
          );
        const clearLayerHint = () => {
          if (section.style.willChange === "opacity, filter") section.style.willChange = "";
        };
        animation.finished.then(clearLayerHint, clearLayerHint);
        animations.push(animation);
      });

      // Fixed case-study sidebar: opening reveal only, synchronized with block 1.
      const sidebar = root.querySelector<HTMLElement>('[data-entrance="last"]');
      if (sidebar) {
        animations.push(
          sidebar.animate(
            reduced
              ? [{ opacity: 0 }, { opacity: 1 }]
              : [
                  { opacity: 0.08, filter: `blur(${LOAD_BLUR}px)` },
                  { opacity: 1, filter: "blur(0px)" },
                ],
            {
              duration: reduced ? 220 : LOAD_DURATION * 1000,
              delay: LOAD_DELAY,
              easing: reduced ? "ease-out" : "cubic-bezier(0.16, 1, 0.3, 1)",
              fill: "backwards",
            },
          ),
        );
      }
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      if (!scrollFade) return;
      const start = window.innerHeight * FADE_START_LINE;
      for (const section of sections) {
        const top = section.getBoundingClientRect().top;
        const raw = Math.max(0, Math.min(1, (start - top) / FADE_DISTANCE));
        // Predominantly linear with a very slight ease-out bias.
        const progress = raw + 0.08 * raw * (1 - raw);
        const opacity = raw >= 0.97 ? 0 : 1 - progress;
        section.style.opacity = opacity.toFixed(3);
        section.style.filter = "";
        section.style.pointerEvents = opacity < 0.03 ? "none" : "";
        section.style.willChange = raw > 0 && raw < 1 ? "opacity" : "";
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    if (scrollFade) {
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
    }
    // Natural-size media can change the page height when metadata/images arrive.
    const resizeObserver = new ResizeObserver(schedule);
    if (scrollFade) root.querySelectorAll("main").forEach((main) => resizeObserver.observe(main));
    return () => {
      cancelAnimationFrame(frame);
      animations.forEach((animation) => animation.cancel());
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      resizeObserver.disconnect();
      sections.forEach((section) => {
        section.style.opacity = "";
        section.style.filter = "";
        section.style.pointerEvents = "";
        section.style.willChange = "";
      });
    };
  }, [playOpening, blurOpening, scrollFade]);

  return (
    <div ref={rootRef} className="contents">
      {children}
    </div>
  );
}
