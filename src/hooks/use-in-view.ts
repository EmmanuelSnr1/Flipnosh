import { useEffect, useRef, MutableRefObject } from "react";

/**
 * Observes an element and adds the class "revealed" when it enters the
 * viewport.  Pairs with the `.reveal` / `.revealed` CSS classes in styles.css.
 *
 * Usage:
 *   const ref = useInView<HTMLDivElement>();
 *   <div ref={ref} className="reveal reveal-delay-1">…</div>
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  threshold = 0.12,
): MutableRefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target); // fire once
          }
        });
      },
      { threshold },
    );

    // Observe the element itself and any .reveal children
    const targets = [el, ...Array.from(el.querySelectorAll(".reveal"))];
    targets.forEach((t) => observer.observe(t));

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
