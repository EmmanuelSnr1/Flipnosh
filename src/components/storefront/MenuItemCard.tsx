import type { MenuItem } from "@/types";
import { gbp } from "@/lib/utils/format";
import { Plus } from "lucide-react";

export function MenuItemCard({ item, onSelect }: { item: MenuItem; onSelect: (i: MenuItem) => void }) {
  return (
    <button
      onClick={() => item.available && onSelect(item)}
      disabled={!item.available}
      className="group flex w-full gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-snug">{item.name}</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{gbp(item.price)}</span>
          {!item.available && <span className="text-xs text-muted-foreground">· Sold out</span>}
        </div>
      </div>
      {item.image && (
        <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
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