import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { jumpToPosition } from "./smoothScroll";

/**
 * Hash-based routing (`#/work/...`) so pages work on any static host without
 * server rewrites. In-page section links scroll programmatically instead.
 */
export const homeHref = "#/";
export const caseStudyHref = "#/work/clinical-data-capture";
export const aeSaeCaseStudyHref = "#/work/ae-sae-prediction";

export type Route = "home" | "case-study" | "ae-sae-case-study";

function parse(hash: string): Route {
  if (hash.startsWith(aeSaeCaseStudyHref)) return "ae-sae-case-study";
  return hash.startsWith(caseStudyHref) ? "case-study" : "home";
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  const currentRoute = useRef(route);
  const positions = useRef<Partial<Record<Route, number>>>({});

  useLayoutEffect(() => {
    jumpToPosition(route === "home" ? 0 : positions.current[route] ?? 0);
  }, [route]);

  useEffect(() => {
    // Our route restoration must not compete with browser Back/Forward scrolling.
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const onChange = () => {
      const next = parse(window.location.hash);
      if (currentRoute.current === next) return;
      positions.current[currentRoute.current] = window.scrollY;
      currentRoute.current = next;
      setRoute(next);
    };
    window.addEventListener("hashchange", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);
  return route;
}
