import { useState, useEffect } from "react";
import type { MenuItem } from "@/types";
import { gbp } from "@/lib/utils/format";
import { cart } from "@/stores/cart-store";
import { X, Minus, Plus, Flame } from "lucide-react";
import { toast } from "sonner";

const DIETARY_EMOJI: Record<string, string> = {
  vegan: "🌱",
  vegetarian: "🥦",
  "gluten-free": "🌾",
  "dairy-free": "🥛",
  halal: "☪️",
  kosher: "✡️",
};
const DIETARY_LABEL: Record<string, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  "gluten-free": "Gluten-free",
  "dairy-free": "Dairy-free",
  halal: "Halal",
  kosher: "Kosher",
};
const SPICE_LABEL: Record<number, string> = {
  1: "🌶 Mild",
  2: "🌶🌶 Medium",
  3: "🌶🌶🌶 Hot",
};

export function ItemDetailModal({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setQty(1);
    setNotes("");
    if (item?.modifiers) {
      const initial: Record<string, string[]> = {};
      for (const g of item.modifiers) {
        initial[g.id] = g.required && !g.multi ? [g.options[0].id] : [];
      }
      setSelections(initial);
    } else {
      setSelections({});
    }
  }, [item]);

  if (!item) return null;

  const toggle = (groupId: string, optId: string, multi: boolean) => {
    setSelections((prev) => {
      const cur = prev[groupId] || [];
      if (multi) {
        return { ...prev, [groupId]: cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId] };
      }
      return { ...prev, [groupId]: [optId] };
    });
  };

  const modsTotal =
    item.modifiers?.reduce((sum, g) => {
      const picked = selections[g.id] || [];
      return sum + g.options.filter((o) => picked.includes(o.id)).reduce((s, o) => s + o.price, 0);
    }, 0) || 0;

  const total = (item.price + modsTotal) * qty;

  const handleAdd = () => {
    const modifiers =
      item.modifiers?.flatMap((g) => {
        const picked = selections[g.id] || [];
        return g.options
          .filter((o) => picked.includes(o.id))
          .map((o) => ({ groupName: g.name, optionName: o.name, price: o.price }));
      }) || [];
    cart.add({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: qty,
      modifiers,
      notes: notes || undefined,
    });
    toast.success(`Added ${qty} × ${item.name} to cart`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-48 sm:h-60 w-full bg-muted shrink-0">
          <img
            src={item.image ?? "/food-placeholder.png"}
            alt={item.name}
            className={`h-full w-full ${item.image ? "object-cover" : "object-contain p-8 opacity-40"}`}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-card/95 text-foreground shadow-md hover:bg-card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <h2 className="text-2xl font-bold text-foreground">{item.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>

          {/* Price + meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-foreground">{gbp(item.price)}</span>
            {item.caloriesKcal != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                <Flame className="h-3 w-3" /> {item.caloriesKcal} kcal
              </span>
            )}
            {item.spiceLevel != null && item.spiceLevel > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-50 border border-red-100 px-2.5 py-0.5 text-xs text-red-600">
                {SPICE_LABEL[item.spiceLevel] ?? "Spicy"}
              </span>
            )}
          </div>

          {/* Dietary chips */}
          {(item.dietaryLabels ?? []).length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {(item.dietaryLabels ?? []).map((lbl) => (
                <span
                  key={lbl}
                  className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {DIETARY_EMOJI[lbl] ?? "•"} {DIETARY_LABEL[lbl] ?? lbl}
                </span>
              ))}
            </div>
          )}

          {/* Allergens */}
          {(item.allergens ?? []).length > 0 && (
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              ⚠ Contains: {item.allergens!.join(", ")}
            </p>
          )}

          {item.modifiers?.map((g) => (
            <div key={g.id} className="mt-5">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">{g.name}</h3>
                <span className="text-xs text-muted-foreground">
                  {g.required ? "Required" : "Optional"}{g.multi ? " · pick any" : " · pick one"}
                </span>
              </div>
              <div className="space-y-1.5">
                {g.options.map((o) => {
                  const picked = (selections[g.id] || []).includes(o.id);
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 transition-colors ${
                        picked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type={g.multi ? "checkbox" : "radio"}
                          name={g.id}
                          checked={picked}
                          onChange={() => toggle(g.id, o.id, g.multi)}
                          className="accent-primary"
                        />
                        <span className="text-sm text-foreground">{o.name}</span>
                      </span>
                      {o.price > 0 && <span className="text-sm text-muted-foreground">+{gbp(o.price)}</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-5">
            <label className="text-sm font-semibold text-foreground">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests?"
              className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
              rows={2}
            />
          </div>
        </div>

        <div className="border-t border-border bg-card p-4 flex items-center gap-3 shrink-0">
          <div className="inline-flex items-center rounded-full border border-border">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2.5"><Minus className="h-4 w-4" /></button>
            <span className="w-8 text-center text-sm font-medium">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="p-2.5"><Plus className="h-4 w-4" /></button>
          </div>
          <button
            onClick={handleAdd}
            className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
          >
            Add to order · {gbp(total)}
          </button>
        </div>
      </div>
    </div>
  );
}