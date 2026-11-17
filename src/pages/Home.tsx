import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { Mouse } from "lucide-react";
import { HoverReveal } from "../components/HoverReveal";
import { NoiseTexture } from "../components/NoiseTexture";
import { PlanetCanvas } from "../components/PlanetCanvas";
import { MediaAsset } from "../components/MediaAsset";
import type { PlanetKind } from "../intro/dither/objects";
import { Typewriter } from "../components/Typewriter";
import { FloatingHeader, ThemeToggle, useTheme } from "../components/blocks";
import { LOAD_BLUR, LOAD_DURATION, STAGGER } from "../components/PageInteractions";
import { nurseProject } from "../content/nurseProject";
import { aeSaeCaseStudyHref, caseStudyHref } from "../router";
import { lockSmoothScroll, scrollToId, unlockSmoothScroll } from "../smoothScroll";

const projectIcon = `${import.meta.env.BASE_URL}assets/projects/icon.png`;

const img = {
  banner:
    "https://res.cloudinary.com/vwlr2h8r/image/upload/v1794764621/Contemplative_Computer_Beneath_the_Sunset.png",
  avatar:
    "https://res.cloudinary.com/vwlr2h8r/image/upload/v1794764699/ChatGPT_Image_Sep_25_2026_04_58_29_PM.jpg",
};

/** Temporary hover images until the final ones are supplied. */
const hoverImg = {
  clinical:
    "https://images.unsplash.com/photo-1766297246931-7b861269dab0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  award:
    "https://images.unsplash.com/photo-1791245024904-f8dbc1621100?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  learning:
    "https://images.unsplash.com/photo-1760840414864-b46ec125487b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  football:
    "https://images.unsplash.com/photo-1486286701208-1d58e9338013?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
};

/** Fill these in to activate the footer links. */
const social = { twitter: "", linkedin: "", gmail: "" };

const roles = ["Product designer", "Builder", "Footballer", "Human"];

function scrollTo(e: MouseEvent, id: string) {
  e.preventDefault();
  scrollToId(id);
}

type Project = { label: string; title: string; description?: string; href?: string; planet: PlanetKind };

const projects: Project[] = [
  {
    label: "Clinical Trials",
    title: nurseProject.title,
    description: nurseProject.description,
    href: caseStudyHref,
    planet: "earth",
  },
  {
    label: "Clinical Trials",
    title: "Designed an AI alert that flags patient risks within seconds, with a full report.",
    description:
      "An early warning system that spots patient safety risks across clinical trial visits before they become serious.",
    href: aeSaeCaseStudyHref,
    planet: "moon",
  },
  {
    label: "Passion Project",
    title: "Memory Palace",
    description: "Creating a app to help me learn and remember more concepts with the help of Spaced Repetation",
    planet: "mars",
  },
];

/**
 * Project card: text on the left, a live dithered planet on the right,
 * spilling past the card edge as in the design. Hovering speeds the planet up;
 * linked cards also show the View cursor and open their case study.
 */
function ProjectCard({
  label,
  title,
  description,
  href,
  planet,
  focused,
  blurred,
  onFocus,
  onClose,
  closing,
}: Project & {
  focused: boolean;
  blurred: boolean;
  onFocus: () => void;
  onClose: () => void;
  closing: boolean;
}) {
  const [hover, setHover] = useState(false);
  const className =
    "relative flex min-h-[244px] flex-col justify-between overflow-hidden rounded-[20px] border border-card-border bg-card px-[19px] pt-[19px] pb-[22px]";
  const content = (
    <>
      <div className="relative z-10 flex items-center gap-2">
        <div className="size-6 shrink-0 overflow-hidden rounded-[5px] border border-[#d9d9d9]">
          <img src={projectIcon} alt="" className="size-full object-cover" />
        </div>
        <p className="text-[14px] leading-[21.6px] text-ink">{label}</p>
      </div>
      <div className="relative z-10 flex w-[68%] max-w-[520px] flex-col gap-[10px]">
        <p className="text-[17px] leading-[28px] text-ink">{title}</p>
        {description && <p className="max-w-[392px] text-[14px] leading-[22px] text-body">{description}</p>}
      </div>
      {/* Updated Figma placement: 340×309 at x=544/y=48 in the 768×244 card. */}
      <div className={`project-card-planet pointer-events-none absolute top-[48px] right-[-116px] h-[309px] w-[340px] max-sm:top-[35px] max-sm:right-[-85px] max-sm:h-[227px] max-sm:w-[250px] ${focused ? "project-card-planet-hidden" : ""}`}>
        <PlanetCanvas planet={planet} fast={hover} />
      </div>
      {focused && (
        <div
          className={`project-focus-menu absolute top-[19px] right-[19px] z-30 flex max-w-[62%] flex-col items-end gap-3 ${closing ? "is-closing" : ""}`}
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <p className="text-[14px] font-medium text-ink">Show me</p>
          <div className="flex flex-col items-end gap-2">
            <button type="button" className="project-action-chip">Screens</button>
            <button
              type="button"
              disabled={!href}
              className="project-action-chip disabled:cursor-not-allowed disabled:opacity-35"
              onClick={() => {
                if (href) window.location.hash = href;
              }}
            >
              Case Study
            </button>
            <button
              type="button"
              className="project-action-chip"
              onClick={() => {
                window.location.href = `mailto:?subject=${encodeURIComponent(`Feedback on ${title}`)}`;
              }}
            >
              Send Feedback
            </button>
          </div>
          <button type="button" onClick={onClose} className="sr-only">Close quick actions</button>
        </div>
      )}
    </>
  );
  const hoverProps = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) };
  const focusClass = focused ? "project-focus-selected" : blurred ? "project-focus-blur" : "";
  return (
    <div
      data-fade
      data-cursor-view={focused ? undefined : ""}
      data-project-focused={focused ? "" : undefined}
      data-project-reveal
      role="button"
      tabIndex={0}
      aria-label={`Right click for quick actions: ${title}`}
      onClick={() => {
        if (focused) onClose();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onFocus();
      }}
      onKeyDown={(event) => {
        if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
          event.preventDefault();
          onFocus();
        } else if (event.key === "Enter" && focused) {
          onClose();
        }
      }}
      className={`${className} ${focusClass}`}
      {...hoverProps}
    >
      {content}
    </div>
  );
}

const navItem = "text-[14px] leading-[16.8px] text-ink transition-opacity hover:opacity-70";

export default function Home({
  animateEntrance = true,
  projectsRevealed,
  onRevealProjects,
}: {
  animateEntrance?: boolean;
  projectsRevealed: boolean;
  onRevealProjects: () => void;
}) {
  const [dark, toggleTheme] = useTheme();
  const [focusedProject, setFocusedProject] = useState<number | null>(null);
  const [focusClosing, setFocusClosing] = useState(false);
  const focusTimer = useRef<number | null>(null);
  const initiallyHidden = useRef(!projectsRevealed);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const projectsRef = useRef<HTMLElement>(null);

  const openFocus = useCallback((index: number) => {
    if (focusTimer.current !== null) window.clearTimeout(focusTimer.current);
    lockSmoothScroll();
    setFocusClosing(false);
    setFocusedProject(index);
  }, []);
  const closeFocus = useCallback(() => {
    if (focusedProject === null || focusClosing) return;
    setFocusClosing(true);
    focusTimer.current = window.setTimeout(() => {
      setFocusedProject(null);
      setFocusClosing(false);
      unlockSmoothScroll();
      focusTimer.current = null;
    }, 720);
  }, [focusedProject, focusClosing]);

  useEffect(
    () => () => {
      if (focusTimer.current !== null) window.clearTimeout(focusTimer.current);
      unlockSmoothScroll();
    },
    [],
  );
  useEffect(() => {
    if (focusedProject === null) return;
    const closeOutside = (event: PointerEvent) => {
      if (!(event.target as Element | null)?.closest("[data-project-focused]")) closeFocus();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFocus();
    };
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [focusedProject, closeFocus]);

  useEffect(() => {
    if (projectsRevealed) return;
    const initialY = window.scrollY;
    const reveal = () => {
      setShowScrollHint(false);
      onRevealProjects();
    };
    const onScroll = () => {
      if (Math.abs(window.scrollY - initialY) > 2) reveal();
    };
    const hintTimer = window.setTimeout(() => setShowScrollHint(true), 2000);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(hintTimer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [projectsRevealed, onRevealProjects]);

  useLayoutEffect(() => {
    if (!projectsRevealed || !initiallyHidden.current) return;
    const section = projectsRef.current;
    if (!section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const blocks = Array.from(section.querySelectorAll<HTMLElement>("[data-project-reveal]"));
    const animations = blocks.map((block, index) =>
      block.animate(
        reduced
          ? [{ opacity: 0.08 }, { opacity: 1 }]
          : [
              { opacity: 0.08, filter: `blur(${LOAD_BLUR}px)` },
              { opacity: 1, filter: "blur(0px)" },
            ],
        {
          duration: reduced ? 220 : LOAD_DURATION * 1000,
          delay: reduced ? 0 : index * STAGGER * 1000,
          easing: reduced ? "ease-out" : "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "backwards",
        },
      ),
    );
    return () => animations.forEach((animation) => animation.cancel());
  }, [projectsRevealed]);
  const blurClass = focusedProject === null ? "" : "project-focus-blur";
  return (
    <div id="home-top" className="relative isolate min-h-screen overflow-x-clip font-sans text-body">
      <NoiseTexture />
      {/* Floating nav */}
      <FloatingHeader className={blurClass} label="Main" themeToggle={<ThemeToggle dark={dark} onToggle={toggleTheme} />}>
        <a href="#/" onClick={(e) => scrollTo(e, "home-top")} className={navItem}>
          Home
        </a>
        <a href="#/" onClick={(e) => scrollTo(e, "playground")} className={navItem}>
          Playground
        </a>
        <a href="#/" onClick={(e) => scrollTo(e, "about")} className={navItem}>
          About
        </a>
      </FloatingHeader>

      <main className="relative z-10 mx-auto flex w-full flex-col gap-10 px-5 pt-[130px] pb-10 md:w-[60%] md:px-0">
        {/* Banner */}
        <div data-fade className={`${blurClass} flex h-[120px] items-center overflow-hidden rounded-[12px] bg-box sm:h-[190px]`}>
          <MediaAsset
            type="image"
            src={img.banner}
            alt=""
            className="h-[105%] w-full"
            mediaClassName="size-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        {/* Intro */}
        <section id="about" className={`${blurClass} flex scroll-mt-[216px] flex-col gap-[30px]`}>
          <div data-fade className="flex items-center gap-2.5">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 className="text-[18px] leading-[21.6px] text-ink">Lavankit Dariwal</h1>
              <Typewriter words={roles} className="h-[18px] text-[14px] leading-[16.8px] text-body" />
            </div>
            <div className="relative size-[46px] shrink-0 overflow-hidden rounded-full">
              <MediaAsset
                type="image"
                src={img.avatar}
                alt="Lavankit Dariwal"
                className="size-full"
                mediaClassName="size-full object-cover"
                loading="lazy"
              />
              <span className="pointer-events-none absolute inset-0 rounded-full border border-line" />
            </div>
          </div>

          <div className="text-[14px] leading-[23.8px] text-body">
            <p data-fade className="tracking-[0.14px]">
              {`I am a designer who wants to know how things work. I currently work in the `}
              <HoverReveal image={hoverImg.clinical} alt="Clinical research">
                clinical trial industry
              </HoverReveal>
              {`, and I won the `}
              <HoverReveal image={hoverImg.award} alt="Design award">
                IIT BHU All India Design Rush
              </HoverReveal>
              {` along the way. I love the technical side of things. Lately, that means LLMs, how they are built, and where AI is heading next. Psychology pulls me in just as much. `}
            </p>
            <p data-fade className="mt-6 tracking-[0.14px]">
              {`I keep learning all of this so I can call myself `}
              <HoverReveal image={hoverImg.learning} alt="Open book">
                a self-learning human model
              </HoverReveal>
              . My syllabus is whatever I get curious about.
            </p>
            <p data-fade className="mt-6">
              {`Outside of work, a free evening usually ends up on a `}
              <HoverReveal image={hoverImg.football} alt="Football on grass">
                football
              </HoverReveal>
              {` ground. If I don’t have a reason to play, I will find one.`}
            </p>
          </div>
        </section>

        {/* Projects */}
        <section
          ref={projectsRef}
          aria-hidden={!projectsRevealed}
          className={`${projectsRevealed ? "projects-revealed" : "projects-locked"} flex flex-col gap-5 pt-10`}
        >
          <div data-fade data-project-reveal className={`${blurClass} flex items-start justify-between gap-6`}>
            <h2 className="text-[15px] leading-[19.2px] text-ink">Projects</h2>
            <p
              className="text-right text-[12px] leading-[19.2px] text-label italic"
              style={{ fontFamily: "'Open Sans:Italic', 'Open Sans', sans-serif", fontVariationSettings: '"wdth" 100' }}
            >
              Right Click on Card for quick actions
            </p>
          </div>
          <div className="flex flex-col gap-5">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.title}
                {...project}
                focused={focusedProject === index}
                blurred={focusedProject !== null && focusedProject !== index}
                onFocus={() => openFocus(index)}
                onClose={closeFocus}
                closing={focusedProject === index && focusClosing}
              />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer data-fade className={`${blurClass} flex flex-col gap-5 pt-[30px]`}>
          <div className="h-px bg-line" />
          <div className="flex items-center justify-end gap-10 text-[16px] leading-[19.2px] text-ink">
            <a href={social.twitter || undefined} target="_blank" rel="noreferrer" className="text-[14px] hover:opacity-70">
              Twitter
            </a>
            <a href={social.linkedin || undefined} target="_blank" rel="noreferrer" className="text-[14px] hover:opacity-70">
              Linkdhin
            </a>
            <a href={social.gmail || undefined} target="_blank" rel="noreferrer" className="text-[14px] hover:opacity-70">
              Gmail
            </a>
          </div>
        </footer>
      </main>
      {!projectsRevealed && (
        <div
          aria-hidden
          className={`scroll-prompt ${showScrollHint ? "is-visible" : ""}`}
        >
          <Mouse size={17} strokeWidth={1.6} />
          <span>Scroll</span>
        </div>
      )}
    </div>
  );
}
