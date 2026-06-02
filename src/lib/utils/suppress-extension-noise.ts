/**
 * Browser security extensions (Bitdefender, Kaspersky, Opera anti-fraud, etc.)
 * inject a `bis_skin_checked` attribute on to every <div> in the page before
 * React hydrates.  The server-rendered HTML doesn't have this attribute, so
 * React fires a hydration-mismatch console.error for every single div — dozens
 * of false positives that drown out real warnings.
 *
 * React's `suppressHydrationWarning` only works one level deep, so we can't
 * annotate every div.  Instead we patch console.error early and drop any
 * warning whose message or component-tree diff contains "bis_skin_checked".
 * Real hydration errors (className mismatches, text content, etc.) are still
 * shown in full.
 *
 * This module must be imported as a side-effect before any React rendering
 * begins.  Import it at the top of __root.tsx.
 */

if (typeof window !== "undefined") {
  const _originalError = console.error.bind(console);

  // eslint-disable-next-line no-console
  console.error = (...args: unknown[]) => {
    // If any argument references the injected extension attribute, swallow it.
    if (args.some((a) => typeof a === "string" && a.includes("bis_skin_checked"))) {
      return;
    }
    _originalError(...args);
  };
}
