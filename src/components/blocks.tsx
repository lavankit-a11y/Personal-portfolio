import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { Moon } from "lucide-react";
import { homeHref } from "../router";
import { runPixelTransition } from "../themeTransition";
import { scrollToId as smoothScrollTo } from "../smoothScroll";
import { MediaAsset } from "./MediaAsset";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- Placeholders ---------- */

type PlaceholderKind = "IMAGE" | "VIDEO" | "LOGO" | "ICON";

/** One simple element so it is easy to swap for real media later. */
export function Placeholder({
  label,
  hint,
  className,
  tone = "default",
}: {
  label: PlaceholderKind;
  hint?: string;
  className?: string;
  tone?: "default" | "stat";
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center gap-1.5 rounded-[14px] px-6 text-center",
        tone === "stat" ? "bg-stat-ph text-white/40" : "bg-ph text-ph-text",
        className,
      )}
    >
      <span className="text-[11px] font-semibold tracking-[0.12em]">{label}</span>
      {hint && <span className="max-w-[46ch] text-[11px] leading-snug opacity-80">{hint}</span>}
    </div>
  );
}

/* ---------- Containers ---------- */

export function MediaBox({
  label = "IMAGE",
  hint,
  ratio = "aspect-[2/1]",
  className,
  video,
  image,
  alt = "",
  cropBottom = 0,
}: {
  label?: PlaceholderKind;
  hint?: string;
  ratio?: string;
  className?: string;
  /** Optional video source. When set, it autoplays muted and loops. */
  video?: string;
  /** Optional real image source. Placeholders remain unchanged when omitted. */
  image?: string;
  alt?: string;
  cropBottom?: number;
}) {
  const isVideo = label === "VIDEO" || !!video;
  return (
    <div
      data-fade
      className={cx(
        "relative flex overflow-hidden rounded-[14px] border border-card-border bg-card",
        video || image ? "p-0" : "p-5 sm:p-10",
        !video && !image ? ratio : undefined,
        className,
      )}
    >
      {video ? (
        <MediaAsset type="video" src={video} alt={alt} cropBottom={cropBottom} className="w-full" mediaClassName="block h-auto w-full" />
      ) : image ? (
        <MediaAsset type="image" src={image} alt={alt} className="w-full" mediaClassName="block h-auto w-full" />
      ) : (
        <Placeholder label={isVideo ? "VIDEO" : label} hint={hint} className="flex-1" />
      )}
      {isVideo && !video && <PauseButton />}
    </div>
  );
}

function VideoEl({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
    setPaused(v.paused);
  };
  return (
    <>
      <video
        ref={ref}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="m-auto max-h-full max-w-full rounded-[14px]"
      />
      <PauseButton paused={paused} onToggle={toggle} />
    </>
  );
}

function PauseButton({ paused: p, onToggle }: { paused?: boolean; onToggle?: () => void }) {
  const [local, setLocal] = useState(false);
  const paused = p ?? local;
  return (
    <button
      type="button"
      aria-label={paused ? "Play video" : "Pause video"}
      onClick={() => (onToggle ? onToggle() : setLocal((v) => !v))}
      className="absolute top-3 right-3 grid size-7 place-items-center rounded-[8px] border border-card-border bg-pill/90 text-ink transition-opacity hover:opacity-75"
    >
      {paused ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
          <path d="M2 1.2v7.6a.5.5 0 0 0 .76.43l6.1-3.8a.5.5 0 0 0 0-.86L2.76.77A.5.5 0 0 0 2 1.2Z" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
          <rect x="1.5" y="1" width="2.4" height="8" rx="0.7" />
          <rect x="6.1" y="1" width="2.4" height="8" rx="0.7" />
        </svg>
      )}
    </button>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return <p data-fade className="mt-3 text-center text-[12px] text-label">{children}</p>;
}

/* ---------- Text ---------- */

/** Shared by eyebrow labels and body copy so they always match; only color differs. */
export const textStyle = "text-[15px] leading-[1.45] tracking-[-0.01em]";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p data-fade className={cx(textStyle, "text-label")}>{children}</p>;
}

export function Heading({ children }: { children: ReactNode }) {
  return <h2 data-fade className="text-[20px] leading-[1.3] font-medium text-ink">{children}</h2>;
}

export function Body({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p data-fade style={style} className={cx(textStyle, "text-body")}>{children}</p>;
}

/** Eyebrow, 8px, heading, 8px, body. Spans the full column. */
export function TextBlock({
  eyebrow,
  heading,
  children,
}: {
  eyebrow?: ReactNode;
  heading: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading>{heading}</Heading>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

/** Block D: text section + one full-column container + caption. */
export function TextMedia({
  id,
  eyebrow,
  heading,
  body,
  media,
  caption,
}: {
  id?: string
  eyebrow?: ReactNode;
  heading: ReactNode;
  body?: ReactNode;
  media: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <Block id={id}>
      <TextBlock eyebrow={eyebrow} heading={heading}>
        {body && <Body>{body}</Body>}
      </TextBlock>
      <div data-fade className="mt-6">{media}</div>
      {caption && <Caption>{caption}</Caption>}
    </Block>
  );
}

/** A content block. Pass `id` when it starts a sidebar chapter. */
export function Block({
  id,
  children,
  className,
}: {
  id?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={cx(id ? "mt-20 scroll-mt-28 sm:mt-24" : "mt-16 sm:mt-20", className)}
    >
      {children}
    </section>
  )
}

/* ---------- Shell ---------- */

export type Chapter = { id: string; label: string };

export function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const onScroll = () => {
      const line = window.innerHeight * 0.4;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // At the very bottom, the last chapter is the one being read.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = ids[ids.length - 1];
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);
  return active;
}

/** Scrolls to a section without touching the URL hash, which is used for routing. */
function scrollToId(e: MouseEvent, id: string) {
  e.preventDefault();
  smoothScrollTo(id);
}

export function Sidebar({ chapters, active }: { chapters: Chapter[]; active: string | null }) {
  return (
    <nav
      aria-label="Chapters"
      data-entrance="last"
      className="fixed top-28 left-[3vw] z-30 hidden w-[15vw] flex-col gap-6 md:flex"
    >
      <a href={homeHref} className="text-[13px] text-label transition-[color,translate] duration-200 hover:translate-x-1 hover:text-ink motion-reduce:transition-none motion-reduce:hover:translate-x-0">
        ← Home
      </a>
      <ul className="flex flex-col gap-2.5">
        {chapters.map((c) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              onClick={(e) => scrollToId(e, c.id)}
              aria-current={active === c.id ? "true" : undefined}
              className={cx(
                "inline-block text-[13px] transition-[color,translate] duration-200 hover:translate-x-1 hover:text-ink motion-reduce:transition-none motion-reduce:hover:translate-x-0",
                active === c.id ? "font-medium text-ink" : "text-label",
              )}
            >
              {c.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Floating header shared by every page, so height, position and the theme
 * control slot are always identical. Pass the page's links as children.
 */
export function FloatingHeader({
  label,
  children,
  themeToggle,
  className,
}: {
  label: string;
  children: ReactNode;
  themeToggle: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-5 pt-10", className)}>
      <nav
        aria-label={label}
        className="pointer-events-auto relative flex h-11 max-w-full items-center gap-5 rounded-full bg-pill/90 pr-1.5 pl-6 text-[14px] leading-[16.8px] backdrop-blur-[10px] sm:gap-[30px] sm:pl-8"
      >
        {children}
        <div className="flex shrink-0 items-center border-l border-line pl-3">{themeToggle}</div>
        <span className="pointer-events-none absolute inset-0 rounded-full border border-pill-border" />
      </nav>
    </div>
  );
}

export function BreadcrumbPill({
  parent,
  current,
  children,
}: {
  parent: string;
  current: string;
  children: ReactNode;
}) {
  return (
    <FloatingHeader label="Breadcrumb" themeToggle={children}>
      <div className="flex min-w-0 items-center gap-2">
        <a href={homeHref} className="shrink-0 text-[12px] text-label transition-colors hover:text-ink">
          {parent}
        </a>
        <span className="text-label">›</span>
        <span className="truncate text-[12px] text-ink">{current}</span>
      </div>
    </FloatingHeader>
  );
}

export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const applyTheme = (next: boolean) => {
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("case-study-theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
    setDark(next);
  };

  const toggleTheme = () => {
    const next = !dark;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyTheme(next);
      return;
    }
    runPixelTransition(next ? "dark" : "light", () => applyTheme(next));
  };

  return [dark, toggleTheme] as const;
}

export function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="grid size-8 shrink-0 place-items-center rounded-full text-body transition-colors hover:bg-box hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      {dark ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <Moon size={15} strokeWidth={1.8} aria-hidden />
      )}
    </button>
  );
}
