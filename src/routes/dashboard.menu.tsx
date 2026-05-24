import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { store, useStore } from "@/lib/mock-store";
import { gbp } from "@/lib/format";
import { Plus, Pencil, Check, X, ImagePlus, Trash2 } from "lucide-react";
import type { MenuItem } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/menu")({
  component: MenuPage,
});

const SLUG = "naturalfingers";

function MenuPage() {
  const { restaurants } = useStore();
  const restaurant = restaurants.find((r) => r.slug === SLUG)!;
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const handleAdd = (categoryId: string, name: string, price: number) => {
    const item: MenuItem = {
      id: `item_${Date.now()}`,
      name,
      description: "Newly added item.",
      price,
      category: categoryId,
      available: true,
    };
    store.addMenuItem(SLUG, categoryId, item);
    setAddingTo(null);
    toast.success(`Added "${name}"`);
  };

  return (
    <>
      <PageHeader
        title="Menu"
        subtitle="Manage categories, items, and availability."
      />
      <div className="p-6 space-y-6">
        {restaurant.menu.map((cat) => (
          <section key={cat.id} className="rounded-2xl border border-border bg-card">
            <header className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div>
                <h2 className="font-semibold">{cat.name}</h2>
                <p className="text-xs text-muted-foreground">{cat.items.length} items</p>
              </div>
              <button
                onClick={() => setAddingTo(addingTo === cat.id ? null : cat.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </button>
            </header>
            <div className="divide-y divide-border">
              {cat.items.map((it) => (
                <MenuRow key={it.id} item={it} />
              ))}
              {addingTo === cat.id && (
                <NewItemRow
                  onCancel={() => setAddingTo(null)}
                  onSave={(name, price) => handleAdd(cat.id, name, price)}
                />
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(item.price.toString());

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    store.setMenuItemImage(SLUG, item.id, url);
    toast.success("Image updated");
  };

  const removeImage = () => {
    store.setMenuItemImage(SLUG, item.id, undefined);
    toast("Image removed");
  };

  const save = () => {
    const p = parseFloat(price);
    if (!name.trim() || Number.isNaN(p)) {
      toast.error("Name and valid price are required");
      return;
    }
    store.updateMenuItem(SLUG, item.id, { name: name.trim(), description, price: p });
    setEditing(false);
    toast.success("Item updated");
  };

  const toggle = () => {
    store.toggleItemAvailability(SLUG, item.id);
    toast(`"${item.name}" → ${item.available ? "Sold out" : "Available"}`);
  };

  if (editing) {
    return (
      <div className="px-5 py-3 space-y-2">
        <div className="grid gap-2 sm:grid-cols-[1fr,100px] items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Item name"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            step="0.01"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Price"
          />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder="Description"
        />
        <div className="flex gap-2">
          <button onClick={save} className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground">
            <Check className="h-3.5 w-3.5" /> Save
          </button>
          <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1 rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <label className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-border bg-muted cursor-pointer group">
          {item.image ? (
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <span className="h-full w-full flex items-center justify-center text-muted-foreground">
              <ImagePlus className="h-4 w-4" />
            </span>
          )}
          <input type="file" accept="image/*" className="sr-only" onChange={onPickImage} />
        </label>
        <div className="min-w-0">
        <p className="font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{gbp(item.price)}</span>
        {item.image && (
          <button
            onClick={removeImage}
            title="Remove image"
            className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={toggle}
          className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
            item.available
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {item.available ? "Available" : "Sold out"}
        </button>
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
    </div>
  );
}

function NewItemRow({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (name: string, price: number) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  return (
    <div className="bg-muted/30 px-5 py-3 grid gap-2 sm:grid-cols-[1fr,120px,auto]">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New item name"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        type="number"
        step="0.01"
        placeholder="0.00"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave(name, parseFloat(price))}
          className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Add
        </button>
        <button onClick={onCancel} className="rounded-full bg-muted px-3.5 py-1.5 text-xs">
          Cancel
        </button>
      </div>
    </div>
  );
}