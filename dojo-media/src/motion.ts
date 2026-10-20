import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Animate from an already readable state. Without JS every section is fully visible. */
export function usePageMotion() {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const animated: HTMLElement[] = [];
    const reveal = (element: Element, delay = 0) => {
      const node = element as HTMLElement;
      node.style.animationDelay = `${delay}ms`;
      node.classList.add("motion-reveal");
      animated.push(node);
    };
    document
      .querySelectorAll(
        ".site-header,.hero-eyebrow,.hero-intro h1,.hero-description",
      )
      .forEach((element, i) => reveal(element, i * 55));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(
            (entry.target as HTMLElement).dataset.revealOrder || 0,
          );
          reveal(entry.target, index * 65);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(
        ".projects-heading,.project-card,.contact-copy,.contact-content>.contact-button,.footer-bottom",
      )
      .forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      animated.forEach((element) => {
        element.classList.remove("motion-reveal");
        element.style.removeProperty("animation-delay");
      });
    };
  }, [reduced]);
}
