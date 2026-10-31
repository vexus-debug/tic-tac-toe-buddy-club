import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Tutorial section/guide pages: /tutorials/:clinicType/:section(/:tutorial)
const tutorialClinic = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] === "tutorials" && parts.length >= 3 ? parts[1] : null;
};

const NAVBAR_OFFSET = 88;

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const prevClinic = previous.current ? tutorialClinic(previous.current) : null;
    const nextClinic = tutorialClinic(pathname);
    previous.current = pathname;

    // When moving between guides/sections inside the tutorials, land on the
    // content itself instead of the page top so readers don't have to scroll
    // past the header again.
    if (prevClinic && nextClinic && prevClinic === nextClinic) {
      const target = document.querySelector<HTMLElement>("[data-tutorial-content]");
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
        window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
