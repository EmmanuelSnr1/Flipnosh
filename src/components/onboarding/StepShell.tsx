import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/shared/Logo";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export type StepDef = { n: number; key: string; label: string };

export const STEPS: StepDef[] = [
  { n: 1, key: "welcome", label: "Welcome" },
  { n: 2, key: "info", label: "Restaurant info" },
  { n: 3, key: "design", label: "Storefront design" },
  { n: 4, key: "menu", label: "Menu" },
  { n: 5, key: "fulfilment", label: "Fulfilment" },
  { n: 6, key: "payments", label: "Payments" },
  { n: 7, key: "preview", label: "Preview & launch" },
  { n: 8, key: "completed", label: "Done" },
];

export function StepShell({
  step,
  completed,
  title,
  subtitle,
  children,
  preview,
  onBack,
  onNext,
  nextLabel = "Continue",
  hideNav = false,
  goTo,
}: {
  step: number;
  completed: number[];
  title: string;
  subtitle?: string;
  children: ReactNode;
  preview?: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  hideNav?: boolean;
  goTo: (step: number) => void;
}) {
  const totalSteps = STEPS.length;
  const pct = Math.round((step / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-border bg-sidebar p-5">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Logo size="sm" showWordmark={false} />
          <span className="font-bold">FlipNosh</span>
        </Link>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Setup progress</p>
        <ol className="space-y-1">
          {STEPS.map((s) => {
            const isDone = completed.includes(s.n);
            const isActive = s.n === step;
            return (
              <li key={s.n}>
                <button
                  onClick={() => goTo(s.n)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : s.n}
                  </span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-auto pt-6">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{pct}% complete</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top progress (mobile) */}
        <div className="md:hidden border-b border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" showWordmark={false} />
              <span className="font-bold text-sm">FlipNosh</span>
            </Link>
            <span className="text-xs text-muted-foreground">
              Step {step} / {totalSteps}
            </span>
          </div>
          <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr,480px] gap-0">
          <div className="flex flex-col">
            <div className="flex-1 px-5 sm:px-10 py-8 max-w-3xl w-full">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
              <div className="mt-6 space-y-6">{children}</div>
            </div>

            {!hideNav && (
              <footer className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur px-5 sm:px-10 py-3 flex items-center justify-between">
                <button
                  onClick={onBack}
                  disabled={!onBack}
                  className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                {onNext && (
                  <button
                    onClick={onNext}
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                  >
                    {nextLabel} <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </footer>
            )}
          </div>

          {preview && (
            <aside className="hidden lg:block border-l border-border bg-muted/20 p-5">
              <div className="sticky top-5 h-[calc(100vh-2.5rem)]">{preview}</div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}