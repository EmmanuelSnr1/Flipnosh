/**
 * Shared sticky nav used across all public marketing pages:
 * Home, Features, Pricing, Login, Signup.
 *
 * Pass `activePage` to highlight the current link.
 */
import { Link, useRouterState } from "@tanstack/react-router";
import { Flame } from "lucide-react";

type ActivePage = "features" | "pricing" | "demo" | "login" | "signup" | null;

export function MarketingNav({ active }: { active?: ActivePage }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = active ?? (
    pathname === "/features" ? "features"
    : pathname === "/pricing" ? "pricing"
    : pathname === "/login" ? "login"
    : pathname === "/signup" ? "signup"
    : null
  );

  const linkCls = (page: ActivePage) =>
    `text-sm transition-colors ${
      current === page
        ? "text-foreground font-medium"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Flame className="h-4 w-4" />
          </span>
          <span className="font-bold text-lg">FlipNosh</span>
        </Link>

        {/* Centre nav */}
        <nav className="hidden sm:flex items-center gap-7">
          <Link to="/features" className={linkCls("features")}>
            Features
          </Link>
          <Link to="/pricing" className={linkCls("pricing")}>
            Pricing
          </Link>
          <Link
            to="/r/$slug"
            params={{ slug: "naturalfingers" }}
            className={linkCls("demo")}
          >
            Demo
          </Link>
          <Link to="/login" className={linkCls("login")}>
            Sign in
          </Link>
        </nav>

        {/* CTA */}
        <Link
          to="/signup"
          className="btn-shimmer glow-primary shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Start free trial
        </Link>
      </div>
    </header>
  );
}
