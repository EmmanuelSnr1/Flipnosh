import { useStore } from "@/lib/mock-store";
import { ExternalLink, Smartphone, Monitor } from "lucide-react";
import { useState } from "react";

/**
 * Mini live preview of the storefront via an iframe.
 * Re-keys on any restaurant change to ensure the preview reflects the latest state.
 */
export function LivePreview({ slug = "naturalfingers", path = "" }: { slug?: string; path?: string }) {
  const { restaurants, onboarding } = useStore();
  const r = restaurants.find((x) => x.slug === slug);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  // Re-render iframe on any meaningful change.
  const stamp = JSON.stringify({
    t: r?.theme,
    b: r?.branding,
    n: r?.name,
    m: r?.menu.map((c) => [c.id, c.name, c.items.map((i) => [i.id, i.name, i.price, i.image])]),
    f: r?.fulfilment,
    s: onboarding.currentStep,
  });

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full">
      <header className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-muted/40">
        <div>
          <p className="text-xs font-semibold">Live preview</p>
          <p className="text-[10px] text-muted-foreground">flipnosh.com/r/{slug}{path}</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="inline-flex rounded-full border border-border bg-card p-0.5">
            <button
              onClick={() => setDevice("mobile")}
              className={`p-1.5 rounded-full ${device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              title="Mobile"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDevice("desktop")}
              className={`p-1.5 rounded-full ${device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              title="Desktop"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
          </div>
          <a
            href={`/r/${slug}${path}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" /> Open
          </a>
        </div>
      </header>
      <div className="flex-1 bg-muted/30 p-3 flex justify-center overflow-auto">
        <div
          className={`bg-background rounded-xl shadow-md overflow-hidden ${
            device === "mobile" ? "w-[360px]" : "w-full max-w-[900px]"
          }`}
          style={{ height: "100%", minHeight: 460 }}
        >
          <iframe
            key={stamp}
            src={`/r/${slug}${path}`}
            title="Storefront preview"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}