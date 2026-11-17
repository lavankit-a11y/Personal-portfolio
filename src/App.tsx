import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CustomCursor } from "./components/CustomCursor";
import { PageInteractions } from "./components/PageInteractions";
import CaseStudy from "./pages/CaseStudy";
import AeSaeCaseStudy from "./pages/AeSaeCaseStudy";
import Home from "./pages/Home";
import { useRoute, type Route } from "./router";
import { initSmoothScroll } from "./smoothScroll";

export default function App() {
  const route = useRoute();
  // Keep the first-scroll gate for the initial Home visit only. Case-study
  // navigation must not re-hide Projects when the visitor returns.
  const [projectsRevealed, setProjectsRevealed] = useState(() => route !== "home");
  const revealProjects = useCallback(() => setProjectsRevealed(true), []);
  // The black WebGL intro (index.html + src/intro/boot.ts) plays when a visit
  // starts on the homepage; Home mounts when it begins to fade away.
  const [homeReady, setHomeReady] = useState(() => !window.__introActive);
  const showHome = route === "home" && homeReady;

  useEffect(() => {
    const reveal = () => setHomeReady(true);
    window.addEventListener("intro:reveal", reveal);
    window.__appReady = true;
    return () => window.removeEventListener("intro:reveal", reveal);
  }, []);

  const visited = useRef(new Set<Route>());
  // Case studies animate on every open; returning Home starts at the top
  // without replaying its first-visit reveal.
  const animateEntrance = route !== "home" || !visited.current.has(route);
  useLayoutEffect(() => {
    if (route === "case-study" || route === "ae-sae-case-study" || showHome) visited.current.add(route);
    if (route !== "home") setProjectsRevealed(true);
  }, [route, showHome]);
  useEffect(() => initSmoothScroll(), []);

  const page = route === "ae-sae-case-study" ? (
    <AeSaeCaseStudy animateEntrance={animateEntrance} />
  ) : route === "case-study" ? (
    <CaseStudy animateEntrance={animateEntrance} />
  ) : (
    showHome && (
      <Home
        animateEntrance={animateEntrance}
        projectsRevealed={projectsRevealed}
        onRevealProjects={revealProjects}
      />
    )
  );
  return (
    <>
      {/* Home is absent while the Saturn intro runs. Include readiness in the
          key so the wrapper mounts again after Home exists and can register
          every opening/scroll section. */}
      <PageInteractions
        key={`${route}-${showHome ? "ready" : "waiting"}`}
        playOpening={animateEntrance}
        blurOpening={route === "home"}
        scrollFade={route === "home"}
      >
        {page}
      </PageInteractions>
      <CustomCursor caseStudy={route !== "home"} />
    </>
  );
}
