/**
 * Shared layout for legal pages (/privacy, /terms).
 * Renders a sticky scrollspy sidebar on desktop and clean prose on all sizes.
 */
import { useEffect, useState, type ReactNode } from "react";
import { MarketingNav } from "./MarketingNav";
import { MarketingFooter } from "./MarketingFooter";

export type LegalSection = {
  id: string;
  label: string;
};

export function LegalShell({
  title,
  subtitle,
  lastUpdated,
  sections,
  children,
}: {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
  children: ReactNode;
}) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry closest to the top of the visible area
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -80% 0px", threshold: 0 },
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />

      <div className="mx-auto max-w-5xl px-6 pt-14 pb-28">
        {/* ── Page header ── */}
        <div className="mb-12 max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Last updated: {lastUpdated}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight leading-tight">
            {title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="flex gap-14 items-start">
          {/* ── Sidebar ── */}
          <aside className="hidden lg:block w-48 shrink-0">
            <nav className="sticky top-24">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Contents
              </p>
              <ul className="space-y-0.5">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        activeId === s.id
                          ? "bg-primary/8 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* ── Content ── */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}

/** Individual section block used inside LegalShell */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 pb-10 mb-10 border-b border-border last:border-0 last:mb-0 last:pb-0"
    >
      <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

/** Unordered list styled for legal prose */
export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 pl-1">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Highlighted callout block (e.g. contact email) */
export function LegalCallout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
      {children}
    </div>
  );
}
