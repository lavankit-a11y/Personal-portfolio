import { useEffect, useRef } from "react";

/**
 * A deliberately eased square cursor for mouse/trackpad devices. Elements with
 * `data-cursor-view` turn it into a plain-text “Right click” affordance.
 */
export function CustomCursor({ caseStudy = false }: { caseStudy?: boolean }) {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let current = { ...target };
    let visible = false;
    let frame = 0;
    let lastTime = 0;
    cursor.dataset.mode = "default";

    const updateHover = () => {
      if (!visible) return;
      const el = document.elementFromPoint(target.x, target.y);
      cursor.dataset.mode = el?.closest("[data-cursor-view]") ? "view" : "default";
    };

    const hide = () => {
      visible = false;
      cursor.style.opacity = "0";
      cursor.dataset.mode = "default";
      document.documentElement.classList.remove("has-custom-cursor");
    };

    const onMove = (event: PointerEvent) => {
      // Preview frames and hybrid devices can report pointer:none/coarse even
      // when a real mouse is in use. Actual input is the reliable signal.
      if (event.pointerType !== "mouse" || reducedMotion.matches) {
        hide();
        return;
      }
      target = { x: event.clientX, y: event.clientY };
      if (!visible) {
        current = { ...target };
        visible = true;
        document.documentElement.classList.add("has-custom-cursor");
        cursor.style.opacity = "1";
      }
      updateHover();
    };

    const onRouteChange = () => {
      cursor.dataset.mode = "default";
    };
    const tick = (time: number) => {
      // A light trail without feeling sluggish, consistent on 60/120Hz screens.
      const dt = Math.min(lastTime ? time - lastTime : 16, 64);
      lastTime = time;
      const amount = 1 - Math.exp(-dt / 70);
      current.x += (target.x - current.x) * amount;
      current.y += (target.y - current.y) * amount;
      cursor.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
      updateHover();
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("hashchange", onRouteChange);
    reducedMotion.addEventListener("change", hide);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("hashchange", onRouteChange);
      reducedMotion.removeEventListener("change", hide);
      hide();
    };
  }, []);

  return (
    <div ref={cursorRef} aria-hidden className="custom-cursor" data-page={caseStudy ? "case-study" : "home"}>
      <span>Right click</span>
    </div>
  );
}
