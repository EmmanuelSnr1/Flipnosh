import type { Restaurant, StorefrontPageId } from "@/types";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { cart } from "@/stores/cart-store";

const themeClassMap: Record<string, string> = {
  classic: "theme-classic",
  modern: "theme-modern",
  bold: "theme-bold",
};

// All possible nav entries — filtered by enabledPages at render time
const ALL_NAV: Array<{ pageId: StorefrontPageId; to: "/r/$slug" | "/r/$slug/menu" | "/r/$slug/contact"; label: string; matchSuffix: string }> = [
  { pageId: "home",    to: "/r/$slug" as const,         label: "Home",    matchSuffix: ""        },
  { pageId: "menu",    to: "/r/$slug/menu" as const,    label: "Menu",    matchSuffix: "/menu"   },
  { pageId: "contact", to: "/r/$slug/contact" as const, label: "Contact", matchSuffix: "/contact"},
];

export function StorefrontShell({
  restaurant,
  children,
  showNav = true,
}: {
  restaurant: Restaurant;
  children: ReactNode;
  showNav?: boolean;
}) {
  const { theme, branding, slug } = restaurant;

  useEffect(() => {
    cart.setRestaurant(slug);
  }, [slug]);

  // Apply restaurant theme via CSS variable overrides scoped to this subtree.
  const styleVars: CSSProperties = {
    ["--primary" as never]: theme.primaryColor,
    ["--accent" as never]: theme.accentColor,
    ["--background" as never]: theme.backgroundColor,
    ["--foreground" as never]: theme.textColor,
    ["--ring" as never]: theme.primaryColor,
  };

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Only show nav entries whose page is in enabledPages.
  // Always ensure "menu" is shown — customers need to order.
  const enabledPages = theme.enabledPages ?? ["home", "menu", "contact"];
  const visibleNav = ALL_NAV.filter((n) => enabledPages.includes(n.pageId));

  return (
    <div
      className={`min-h-screen bg-background text-foreground ${themeClassMap[theme.themeName] ?? ""}`}
      style={styleVars}
    >
      {showNav && (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <Link
              to="/r/$slug"
              params={{ slug }}
              className="flex items-center gap-2 font-bold tracking-tight"
            >
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={restaurant.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span
                  className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] text-primary-foreground font-bold"
                  style={{ background: theme.primaryColor }}
                >
                  {restaurant.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="truncate max-w-[180px]">{restaurant.name}</span>
            </Link>

            <nav className="flex items-center gap-1 text-sm">
              {visibleNav.map((n) => {
                const match = `/r/${slug}${n.matchSuffix}`;
                const active = pathname === match;
                return (
                  <Link
                    key={n.pageId}
                    to={n.to}
                    params={{ slug }}
                    className={`px-3 py-1.5 rounded-full transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
