/**
 * Intro loader. The stage (gradient, noise and loading bar) is static HTML in
 * index.html, so it is visible on the very first paint. This tiny module then
 * loads the three.js dither scene and mounts it into that shell.
 *
 * Hand-off with the app (window events):
 *  - the app sets `window.__appReady = true` once mounted
 *  - when the loading bar is full the intro fires
 *    `intro:reveal`, fades out, then `intro:done`
 */

declare global {
  interface Window {
    __appReady?: boolean;
    __introActive?: boolean;
    __portfolioAssetsReady?: Promise<unknown>;
  }
}

const FADE_MS = 700;

function run(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>("[data-intro-stage]");
  const bar = root.querySelector<HTMLElement>("[data-intro-bar]");
  const greeting = root.querySelector<HTMLElement>("[data-intro-greeting]");
  const setProgress = (p: number) => {
    if (bar) bar.style.transform = `scaleX(${p})`;
  };
  let unmount: (() => void) | undefined;
  let ended = false;

  // Waits for the app before revealing, so the fade never shows a blank page.
  const end = () => {
    if (ended) return;
    ended = true;
    setProgress(1);
    const reveal = async () => {
      if (!window.__appReady) {
        requestAnimationFrame(reveal);
        return;
      }
      // The images and old-interface video have been downloading throughout
      // the Saturn sequence. Wait for them before exposing the homepage.
      await Promise.race([
        window.__portfolioAssetsReady,
        new Promise((resolve) => window.setTimeout(resolve, 1500)),
      ]);
      window.dispatchEvent(new Event("intro:reveal"));
      root.style.opacity = "0";
      root.style.pointerEvents = "none";
      window.setTimeout(() => {
        unmount?.();
        root.remove();
        window.__introActive = false;
        window.dispatchEvent(new Event("intro:done"));
      }, FADE_MS);
    };
    reveal();
  };
  window.addEventListener("keydown", (e) => e.key === "Escape" && end());

  if (!host) return end();
  import("./mountIntro")
    .then(({ mountIntro }) => {
      if (ended) return;
      unmount = mountIntro(host, {
        onProgress: setProgress,
        onReady: () => greeting?.classList.add("is-visible"),
        // Reaching 100% takes the visitor to the homepage.
        onComplete: end,
      });
    })
    .catch(end);
}

const root = document.getElementById("intro");
if (root) run(root);

export {};
