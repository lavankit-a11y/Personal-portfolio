import { useEffect, useState } from "react";

const TYPE_MS = 90;
const DELETE_MS = 45;
const HOLD_MS = 3500;
const GAP_MS = 400;

/** Types each word, holds it, backspaces it, then moves on. Loops forever. */
export function Typewriter({ words, className }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [reduced] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );

  useEffect(() => {
    if (reduced) return;
    const word = words[index % words.length];
    let t: number;
    if (!deleting) {
      t =
        text.length < word.length
          ? window.setTimeout(() => setText(word.slice(0, text.length + 1)), TYPE_MS)
          : window.setTimeout(() => setDeleting(true), HOLD_MS);
    } else if (text.length > 0) {
      t = window.setTimeout(() => setText(word.slice(0, text.length - 1)), DELETE_MS);
    } else {
      t = window.setTimeout(() => {
        setDeleting(false);
        setIndex((i) => (i + 1) % words.length);
      }, GAP_MS);
    }
    return () => window.clearTimeout(t);
  }, [text, deleting, index, words, reduced]);

  return (
    <span className={className}>
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden className="inline-flex items-center">
        {reduced ? words[0] : text}
        <span className="typewriter-caret ml-px inline-block h-[1.05em] w-px bg-current" />
      </span>
    </span>
  );
}
