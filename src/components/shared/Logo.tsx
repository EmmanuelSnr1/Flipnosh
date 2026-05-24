import { Flame } from "lucide-react";

export function Logo({
  size = "md",
  showWordmark = true,
}: {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}) {
  const dims = {
    sm: { box: "h-7 w-7", icon: "h-4 w-4", text: "text-base" },
    md: { box: "h-9 w-9", icon: "h-5 w-5", text: "text-lg" },
    lg: { box: "h-14 w-14", icon: "h-7 w-7", text: "text-2xl" },
  }[size];

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`relative inline-flex ${dims.box} items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm`}
      >
        <Flame className={dims.icon} />
      </span>
      {showWordmark && (
        <span className={`font-bold tracking-tight ${dims.text}`}>
          Flip<span className="text-primary">Nosh</span>
        </span>
      )}
    </span>
  );
}