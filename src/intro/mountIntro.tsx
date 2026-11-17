import { createRoot } from "react-dom/client";
import { DitherIntro } from "./DitherIntro";

/** Mounts the dither intro into the static #intro shell from index.html. */
export function mountIntro(
  host: HTMLElement,
  hooks: { onProgress: (p: number) => void; onComplete: () => void; onReady: () => void },
) {
  const root = createRoot(host);
  root.render(<DitherIntro onProgress={hooks.onProgress} onComplete={hooks.onComplete} onReady={hooks.onReady} />);
  return () => root.unmount();
}
