import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  getDashboardMenu,
  updateDashboardMenuItem,
  createDashboardMenuItem,
  createDashboardMenuCategory,
  dashboardSearch,
  type DashboardMenuItem,
  type DashboardMenuCategory,
  type DashboardMenuData,
} from "@/api/dashboard";
import { gbp } from "@/lib/utils/format";
import { Plus, Pencil, Check, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/menu")({
  validateSearch: dashboardSearch,
  loaderDeps: ({ search }) => ({ r: (search as { r?: string }).r }),
  loader: async ({ deps: { r } }) => getDashboardMenu({ data: r! }),
  component: MenuPage,
});

function MenuPage() {
  const menuData = Route.useLoaderData() as DashboardMenuData | null | undefined;
  const { r } = Route.useSearch();
  const restaurantId = r!;
  const router = useRouter();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);

  if (!menuData) {
    return (
      <>
        <PageHeader
          title="Menu"
          subtitle="Manage categories, items, and availability."
        />
        <div className="p-6">
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No menu found. Complete onboarding to generate your initial menu.
            </p>
          </div>
        </div>
      </>
    );
  }

  const handleAddItem = async (
    categoryId: string,
    name: string,
    price: number,
  ) => {
    try {
      await createDashboardMenuItem({
        data: {
          restaurantId,
          categoryId,
          name,
          pricePence: Math.round(price * 100),
        },
      });
      setAddingTo(null);
      toast.success(`Added "${name}"`);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add item");
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      await createDashboardMenuCategory({
        data: { restaurantId, menuId: menuData.menuId, name },
      });
      setAddingCategory(false);
      toast.success(`Added category "${name}"`);
      await router.invalidate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add category",
      );
    }
  };

  const handleUpdateItem = async (
    id: string,
    patch: {
      name?: string;
      description?: string;
      pricePence?: number;
      isAvailable?: boolean;
    },
  ) => {
    try {
      await updateDashboardMenuItem({ data: { id, ...patch } });
      await router.invalidate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update item",
      );
    }
  };

  return (
    <>
      <PageHeader
        title="Menu"
        subtitle="Manage categories, items, and availability."
        action={
          <button
            onClick={() => setAddingCategory(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add category
          </button>
        }
      />
      <div className="p-6 space-y-6">
        {addingCategory && (
          <NewCategoryRow
            onCancel={() => setAddingCategory(false)}
            onSave={handleAddCategory}
          />
        )}

        {menuData.categories.map((cat: DashboardMenuCategory) => (
          <section
            key={cat.id}
            className="rounded-2xl border border-border bg-card"
          >
            <header className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div>
                <h2 className="font-semibold">{cat.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {cat.items.length} items
                </p>
              </div>
              <button
                onClick={() =>
                  setAddingTo(addingTo === cat.id ? null : cat.id)
                }
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </button>
            </header>
            <div className="divide-y divide-border">
              {cat.items.map((it: DashboardMenuItem) => (
                <MenuRow
                  key={it.id}
                  item={it}
                  category={cat}
                  onUpdate={handleUpdateItem}
                />
              ))}
              {addingTo === cat.id && (
                <NewItemRow
                  onCancel={() => setAddingTo(null)}
                  onSave={(name, price) =>
                    handleAddItem(cat.id, name, price)
                  }
                />
              )}
            </div>
          </section>
        ))}

        {menuData.categories.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No categories yet. Add one to get started.
          </div>
        )}
      </div>
    </>
  );
}

function MenuRow({
  item,
  onUpdate,
}: {
  item: DashboardMenuItem;
  category: DashboardMenuCategory;
  onUpdate: (
    id: string,
    patch: {
      name?: string;
      description?: string;
      pricePence?: number;
      isAvailable?: boolean;
    },
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [price, setPrice] = useState((item.price_pence / 100).toFixed(2));

  const save = () => {
    const p = parseFloat(price);
    if (!name.trim() || Number.isNaN(p) || p <= 0) {
      toast.error("Name and a valid price are required");
      return;
    }
    onUpdate(item.id, {
      name: name.trim(),
      description,
      pricePence: Math.round(p * 100),
    });
    setEditing(false);
    toast.success("Item updated");
  };

  const toggle = () => {
    onUpdate(item.id, { isAvailable: !item.is_available });
    toast(
      `"${item.name}" → ${item.is_available ? "Sold out" : "Available"}`,
    );
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
            min="0"
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
          <button
            onClick={save}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground"
          >
            <Check className="h-3.5 w-3.5" /> Save
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setName(item.name);
              setDescription(item.description ?? "");
              setPrice((item.price_pence / 100).toFixed(2));
            }}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center text-muted-foreground">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {item.description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {gbp(item.price_pence / 100)}
        </span>
        <button
          onClick={toggle}
          className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
            item.is_available
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {item.is_available ? "Available" : "Sold out"}
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

  const handleSave = () => {
    const p = parseFloat(price);
    if (!name.trim() || Number.isNaN(p) || p <= 0) {
      toast.error("Enter a name and valid price");
      return;
    }
    onSave(name.trim(), p);
  };

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
        min="0"
        placeholder="0.00"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="rounded-full bg-muted px-3.5 py-1.5 text-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function NewCategoryRow({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    onSave(name.trim());
  };

  return (
    <div className="rounded-2xl border border-primary/40 bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        New category
      </p>
      <div className="flex gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Category name (e.g. Starters)"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={handleSave}
          className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="rounded-full bg-muted px-3.5 py-1.5 text-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
