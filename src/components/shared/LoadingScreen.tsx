import { Logo } from "./Logo";

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background/90 backdrop-blur-sm">
      <div className="animate-pulse">
        <Logo size="lg" />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
        <span className="ml-2">{label}</span>
      </div>
    </div>
  );
}

export function RouteLoadingBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[101] h-0.5 overflow-hidden bg-transparent">
      <div className="h-full w-1/3 animate-[loadingBar_1s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary to-transparent" />
      <style>{`@keyframes loadingBar { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>
    </div>
  );
}