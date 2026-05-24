import type { MenuItem } from "@/types";
import { gbp } from "@/lib/utils/format";
import { Plus, Star } from "lucide-react";

const DIETARY_EMOJI: Record<string, string> = {
  vegan: "🌱",
  vegetarian: "🥦",
  "gluten-free": "🌾",
  "dairy-free": "🥛",
  halal: "☪️",
  kosher: "✡️",
};

const SPICE_ICON: Record<number, string> = {
  1: "🌶",
  2: "🌶🌶",
  3: "🌶🌶🌶",
};

export function MenuItemCard({
  item,
  onSelect,
}: {
  item: MenuItem;
  onSelect: (i: MenuItem) => void;
}) {
  const spice = item.spiceLevel && item.spiceLevel > 0 ? SPICE_ICON[item.spiceLevel] : null;
  const labels = item.dietaryLabels ?? [];

  return (
    <button
      onClick={() => item.available && onSelect(item)}
      disabled={!item.available}
      className="group flex w-full gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          {item.isFeatured && (
            <Star className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-400 fill-amber-300" />
          )}
          <h3 className="font-semibold text-foreground leading-snug">
            {item.name}
          </h3>
          {spice && (
            <span className="ml-1 shrink-0 text-sm">{spice}</span>
          )}
        </div>

        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {item.description}
        </p>

        {/* Dietary chips */}
        {labels.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {labels.map((lbl) => (
              <span
                key={lbl}
                className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground leading-none"
              >
                {DIETARY_EMOJI[lbl] ?? "•"} {lbl}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">
            {gbp(item.price)}
          </span>
          {item.caloriesKcal != null && (
            <span className="text-xs text-muted-foreground">
              · {item.caloriesKcal} kcal
            </span>
          )}
          {!item.available && (
            <span className="text-xs text-muted-foreground">· Sold out</span>
          )}
        </div>
      </div>

      {item.image && (
        <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
          {item.available && (
            <span className="absolute bottom-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-110">
              <Plus className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
    </button>
  );
}
