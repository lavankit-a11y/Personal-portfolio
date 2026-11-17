import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Dotted-underlined inline text. On hover (or keyboard focus) the text turns
 * primary and a floating image follows the pointer; it fades away on leave.
 */
export function HoverReveal({
  children,
  image,
  alt,
}: {
  children: ReactNode;
  image: string;
  alt: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <>
      <span
        tabIndex={0}
        className="cursor-default underline decoration-ink decoration-dotted decoration-1 underline-offset-[3px] transition-colors duration-200 outline-none hover:text-ink focus-visible:text-ink"
        onMouseEnter={(e) => {
          setPos({ x: e.clientX, y: e.clientY });
          setOpen(true);
        }}
        onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setOpen(false)}
        onFocus={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ x: r.left + r.width / 2, y: r.top });
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {createPortal(
        <div
          aria-hidden
          // The document theme class reaches this portaled layer too.
          className="pointer-events-none fixed z-50"
          style={{ left: pos.x, top: pos.y, transform: "translate(-50%, calc(-100% - 18px))" }}
        >
          <img
            src={image}
            alt={alt}
            className="block h-[150px] w-[200px] rounded-[12px] border border-line object-cover shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)] transition-[opacity,transform] duration-300 ease-out"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "scale(1) rotate(-3deg)" : "scale(0.92) rotate(0deg)",
            }}
          />
        </div>,
        document.body,
      )}
    </>
  );
}
