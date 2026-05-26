import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Flame className="h-3 w-3" />
          </span>
          <span className="font-semibold text-foreground">FlipNosh</span>
          <span className="text-border mx-1">·</span>
          <span>© 2026. All rights reserved.</span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Link to="/features" className="hover:text-foreground transition-colors">
            Features
          </Link>
          <Link to="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <a
            href="mailto:hello@flipnosh.com"
            className="hover:text-foreground transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
