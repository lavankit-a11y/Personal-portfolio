import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { createPortal } from "react-dom";

type MediaType = "image" | "video";

function VideoControls({
  videoRef,
  paused,
  onPausedChange,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  paused: boolean;
  onPausedChange: (paused: boolean) => void;
}) {
  const stop = (event: MouseEvent) => event.stopPropagation();
  const toggle = async (event: MouseEvent<HTMLButtonElement>) => {
    stop(event);
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try {
        await video.play();
        onPausedChange(false);
      } catch {
        onPausedChange(video.paused);
      }
    } else {
      video.pause();
      onPausedChange(true);
    }
  };
  const restart = async (event: MouseEvent<HTMLButtonElement>) => {
    stop(event);
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    try {
      await video.play();
      onPausedChange(false);
    } catch {
      onPausedChange(video.paused);
    }
  };

  const button =
    "absolute z-20 grid size-8 place-items-center rounded-[8px] border border-card-border bg-pill/90 text-ink backdrop-blur-sm transition-opacity hover:opacity-75";
  return (
    <>
      <button type="button" aria-label={paused ? "Play video" : "Pause video"} onClick={toggle} className={`${button} top-3 right-3`}>
        {paused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
      </button>
      <button type="button" aria-label="Restart video" onClick={restart} className={`${button} right-3 bottom-3`}>
        <RotateCcw size={15} />
      </button>
    </>
  );
}

function Video({
  src,
  className,
  autoPlay = true,
  viewportAware = true,
  style,
  onDimensions,
}: {
  src: string;
  className: string;
  autoPlay?: boolean;
  viewportAware?: boolean;
  style?: CSSProperties;
  onDimensions?: (width: number, height: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(viewportAware || !autoPlay);
  useEffect(() => {
    const video = ref.current;
    if (!video || !autoPlay || !viewportAware) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.preload = "auto";
          video.play().catch(() => {});
        }
        else video.pause();
      },
      { rootMargin: "160px 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlay, viewportAware]);
  return (
    <>
      <video
        ref={ref}
        src={src}
        autoPlay={autoPlay && !viewportAware}
        muted
        loop
        playsInline
        preload={viewportAware ? "none" : "auto"}
        className={className}
        style={style}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          onDimensions?.(video.videoWidth, video.videoHeight);
        }}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
      />
      <VideoControls videoRef={ref} paused={paused} onPausedChange={setPaused} />
    </>
  );
}

function Lightbox({
  type,
  src,
  alt,
  onClose,
}: {
  type: MediaType;
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || (type === "video" ? "Video preview" : "Image preview")}
      className="fixed inset-0 z-[2147483645] grid place-items-center bg-page/88 p-5 backdrop-blur-xl"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close preview"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="fixed top-5 right-5 z-30 grid size-10 place-items-center rounded-full border border-card-border bg-pill text-ink transition-opacity hover:opacity-70"
      >
        <X size={18} />
      </button>
      <div
        className="relative h-[88vh] w-[94vw] overflow-hidden rounded-[14px] border border-card-border bg-card"
        onClick={(event) => event.stopPropagation()}
      >
        {type === "video" ? (
          <Video src={src} className="block size-full object-contain" viewportAware={false} />
        ) : (
          <img src={src} alt={alt} className="block size-full object-contain" />
        )}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Clickable image/video with a shared enlarged preview. Video assets also get
 * pause/play and restart controls inline and in the modal.
 */
export function MediaAsset({
  type,
  src,
  alt = "",
  className = "",
  mediaClassName = "size-full object-cover",
  loading,
  fetchPriority,
  children,
  cropBottom = 0,
}: {
  type: MediaType;
  src: string;
  alt?: string;
  className?: string;
  mediaClassName?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  children?: ReactNode;
  /** Fraction of the inline video's source height to clip from its bottom. */
  cropBottom?: number;
}) {
  const [open, setOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 16, height: 9 });
  const crop = Math.min(0.5, Math.max(0, cropBottom));
  const cropped = type === "video" && crop > 0;
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open ${type} preview`}
        className={`relative cursor-zoom-in overflow-hidden ${className}`}
        style={cropped ? { aspectRatio: dimensions.width / (dimensions.height * (1 - crop)) } : undefined}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {type === "video" ? (
          <Video
            src={src}
            className={cropped ? "absolute top-0 left-0 block w-full max-w-none object-fill" : mediaClassName}
            style={cropped ? { height: `${100 / (1 - crop)}%` } : undefined}
            onDimensions={(width, height) => {
              if (width > 0 && height > 0) setDimensions({ width, height });
            }}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            loading={loading}
            decoding="async"
            fetchPriority={fetchPriority}
            className={mediaClassName}
          />
        )}
        {children}
      </div>
      {open && <Lightbox type={type} src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
