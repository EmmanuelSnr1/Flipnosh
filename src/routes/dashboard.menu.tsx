import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  getDashboardMenu,
  updateDashboardMenuItem,
  createDashboardMenuItem,
  createDashboardMenuCategory,
  deleteDashboardMenuItem,
  deleteDashboardMenuCategory,
  addModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
  addModifier,
  deleteModifier,
  dashboardSearch,
  type DashboardMenuItem,
  type DashboardMenuCategory,
  type DashboardMenuData,
  type DashboardModifierGroup,
  type DashboardModifier,
} from "@/api/dashboard";
import { gbp } from "@/lib/utils/format";
import {
  Plus,
  Pencil,
  Check,
  X,
  Star,
  ChevronDown,
  ChevronUp,
  Flame,
  Trash2,
} from "lucide-react";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/menu")({
  validateSearch: dashboardSearch,
  loaderDeps: ({ search }) => ({ r: (search as { r?: string }).r }),
  loader: async ({ deps: { r } }) => getDashboardMenu({ data: r! }),
  component: MenuPage,
});

// ─── Constants ────────────────────────────────────────────────────────────────

const DIETARY_OPTIONS = [
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🥦" },
  { id: "gluten-free", label: "Gluten-free", emoji: "🌾" },
  { id: "dairy-free", label: "Dairy-free", emoji: "🥛" },
  { id: "halal", label: "Halal", emoji: "☪️" },
  { id: "kosher", label: "Kosher", emoji: "✡️" },
] as const;

const ALLERGEN_OPTIONS = [
  { id: "gluten", label: "Gluten" },
  { id: "dairy", label: "Dairy" },
  { id: "eggs", label: "Eggs" },
  { id: "nuts", label: "Tree nuts" },
  { id: "peanuts", label: "Peanuts" },
  { id: "soy", label: "Soy" },
  { id: "fish", label: "Fish" },
  { id: "shellfish", label: "Shellfish" },
  { id: "sesame", label: "Sesame" },
  { id: "celery", label: "Celery" },
  { id: "mustard", label: "Mustard" },
  { id: "sulphites", label: "Sulphites" },
] as const;

const SPICE_LEVELS = [
  { value: 0, label: "None", icon: "—" },
  { value: 1, label: "Mild", icon: "🌶" },
  { value: 2, label: "Medium", icon: "🌶🌶" },
  { value: 3, label: "Hot", icon: "🌶🌶🌶" },
] as const;

// ─── Item Modal ────────────────────────────────────────────────────────────────

type ItemFormState = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  calories: string;
  spiceLevel: number;
  dietaryLabels: string[];
  allergens: string[];
  isFeatured: boolean;
};

function blankForm(item?: DashboardMenuItem): ItemFormState {
  return {
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: item ? (item.price_pence / 100).toFixed(2) : "",
    imageUrl: item?.image_url ?? "",
    calories: item?.calories_kcal != null ? String(item.calories_kcal) : "",
    spiceLevel: item?.spice_level ?? 0,
    dietaryLabels: item?.dietary_labels ?? [],
    allergens: item?.allergens ?? [],
    isFeatured: item?.is_featured ?? false,
  };
}

function ItemModal({
  categoryId,
  item,
  onClose,
  onSaved,
  restaurantId,
}: {
  categoryId: string;
  item?: DashboardMenuItem;
  onClose: () => void;
  onSaved: () => void;
  restaurantId: string;
}) {
  const isEdit = !!item;
  const [form, setForm] = useState<ItemFormState>(() => blankForm(item));
  const [saving, setSaving] = useState(false);
  // Stable storage path — use existing item ID when editing, random UUID for new items
  const uploadPath = useRef(
    `${restaurantId}/${item?.id ?? crypto.randomUUID()}`,
  );
  const [allergensOpen, setAllergensOpen] = useState(
    (item?.allergens?.length ?? 0) > 0,
  );
  const [tab, setTab] = useState<"details" | "modifiers">("details");
  const [modGroups, setModGroups] = useState<DashboardModifierGroup[]>(
    item?.modifier_groups ?? [],
  );

  const set = <K extends keyof ItemFormState>(k: K, v: ItemFormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const toggleLabel = (id: string) =>
    set(
      "dietaryLabels",
      form.dietaryLabels.includes(id)
        ? form.dietaryLabels.filter((x) => x !== id)
        : [...form.dietaryLabels, id],
    );

  const toggleAllergen = (id: string) =>
    set(
      "allergens",
      form.allergens.includes(id)
        ? form.allergens.filter((x) => x !== id)
        : [...form.allergens, id],
    );

  const handleSave = async () => {
    const p = parseFloat(form.price);
    if (!form.name.trim() || Number.isNaN(p) || p <= 0) {
      toast.error("Name and a valid price are required");
      return;
    }
    setSaving(true);
    try {
      const cals = form.calories.trim()
        ? parseInt(form.calories, 10)
        : undefined;
      if (isEdit) {
        await updateDashboardMenuItem({
          data: {
            id: item!.id,
            name: form.name.trim(),
            description: form.description.trim(),
            pricePence: Math.round(p * 100),
            imageUrl: form.imageUrl.trim() || null,
            caloriesKcal: Number.isNaN(cals as number) ? null : (cals ?? null),
            spiceLevel: form.spiceLevel,
            dietaryLabels: form.dietaryLabels,
            allergens: form.allergens,
            isFeatured: form.isFeatured,
          },
        });
        toast.success(`"${form.name}" updated`);
      } else {
        await createDashboardMenuItem({
          data: {
            restaurantId,
            categoryId,
            name: form.name.trim(),
            description: form.description.trim(),
            pricePence: Math.round(p * 100),
            imageUrl: form.imageUrl.trim() || null,
            caloriesKcal: Number.isNaN(cals as number) ? null : (cals ?? null),
            spiceLevel: form.spiceLevel,
            dietaryLabels: form.dietaryLabels,
            allergens: form.allergens,
            isFeatured: form.isFeatured,
          },
        });
        toast.success(`"${form.name}" added`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-lg">
            {isEdit ? "Edit item" : "Add menu item"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex shrink-0 border-b border-border">
          {(["details", "modifiers"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              disabled={t === "modifiers" && !isEdit}
              title={t === "modifiers" && !isEdit ? "Save the item first to add modifiers" : undefined}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {t === "modifiers" && modGroups.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold h-4 min-w-[1rem] px-1">
                  {modGroups.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {tab === "modifiers" ? (
            <ModifiersPanel
              itemId={item!.id}
              restaurantId={restaurantId}
              groups={modGroups}
              onGroupsChange={setModGroups}
            />
          ) : (
          <div className="space-y-5">
          {/* Food image — direct upload to Supabase Storage */}
          <ImageUpload
            label="Food image"
            currentUrl={form.imageUrl || undefined}
            bucket="menu-item-images"
            path={uploadPath.current}
            aspect="aspect-[4/3]"
            onUploaded={(url) => set("imageUrl", url)}
            onCleared={() => set("imageUrl", "")}
          />

          {/* Name + Price */}
          <div className="grid gap-3 sm:grid-cols-[1fr,130px]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Item name <span className="text-destructive">*</span>
              </label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Classic Cheeseburger"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Price (£) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Describe the dish — ingredients, cooking style, what makes it special…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Calories + Spice */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Calories (kcal)
              </label>
              <input
                type="number"
                min="0"
                value={form.calories}
                onChange={(e) => set("calories", e.target.value)}
                placeholder="e.g. 650"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Spice level
              </label>
              <div className="flex gap-1.5">
                {SPICE_LEVELS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("spiceLevel", s.value)}
                    title={s.label}
                    className={`flex-1 rounded-lg border px-1.5 py-2 text-sm transition-colors ${
                      form.spiceLevel === s.value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dietary labels */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Dietary labels
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((d) => {
                const active = form.dietaryLabels.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleLabel(d.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span>{d.emoji}</span>
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergens (collapsible) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setAllergensOpen((o) => !o)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {allergensOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              Allergens
              {form.allergens.length > 0 && (
                <span className="rounded-full bg-amber-100 text-amber-700 px-1.5 text-[10px] font-semibold">
                  {form.allergens.length}
                </span>
              )}
            </button>
            {allergensOpen && (
              <div className="flex flex-wrap gap-2">
                {ALLERGEN_OPTIONS.map((a) => {
                  const active = form.allergens.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAllergen(a.id)}
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors ${
                        active
                          ? "border-amber-400 bg-amber-50 text-amber-700 font-medium"
                          : "border-border bg-background text-muted-foreground hover:border-amber-300"
                      }`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Featured toggle */}
          <div
            className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-colors ${
              form.isFeatured
                ? "border-amber-400/60 bg-amber-50/60"
                : "border-border bg-background hover:bg-muted/40"
            }`}
            onClick={() => set("isFeatured", !form.isFeatured)}
          >
            <div className="flex items-center gap-2.5">
              <Star
                className={`h-4 w-4 ${form.isFeatured ? "text-amber-500 fill-amber-400" : "text-muted-foreground"}`}
              />
              <div>
                <p className="text-sm font-medium">Featured item</p>
                <p className="text-xs text-muted-foreground">
                  Highlighted in the storefront
                </p>
              </div>
            </div>
            <div
              className={`h-5 w-9 rounded-full transition-colors relative ${form.isFeatured ? "bg-amber-400" : "bg-muted"}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isFeatured ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
          </div>
          </div>
          )}
        </div>

        {/* Footer — only shown on the Details tab */}
        {tab === "details" && (
        <div className="shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {saving
              ? isEdit
                ? "Saving…"
                : "Adding…"
              : isEdit
                ? "Save changes"
                : "Add item"}
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

// ─── Modifiers Panel ─────────────────────────────────────────────────────────

function ModifiersPanel({
  itemId,
  restaurantId,
  groups,
  onGroupsChange,
}: {
  itemId: string;
  restaurantId: string;
  groups: DashboardModifierGroup[];
  onGroupsChange: (g: DashboardModifierGroup[]) => void;
}) {
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    setSavingGroup(true);
    try {
      const row = await addModifierGroup({
        data: { restaurantId, menuItemId: itemId, name: newGroupName.trim() },
      });
      onGroupsChange([...groups, { ...row, modifiers: [] }]);
      setNewGroupName("");
      setAddingGroup(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add group");
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await deleteModifierGroup({ data: { id } });
      onGroupsChange(groups.filter((g) => g.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete group");
    }
  };

  const handleUpdateGroup = async (
    id: string,
    patch: { name?: string; required?: boolean; maxSelect?: number },
  ) => {
    try {
      await updateModifierGroup({ data: { id, ...patch } });
      onGroupsChange(
        groups.map((g) =>
          g.id === id
            ? {
                ...g,
                ...(patch.name      !== undefined && { name: patch.name }),
                ...(patch.required  !== undefined && { required: patch.required, min_select: patch.required ? 1 : 0 }),
                ...(patch.maxSelect !== undefined && { max_select: patch.maxSelect }),
              }
            : g,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update group");
    }
  };

  const handleAddModifier = async (groupId: string, name: string, priceDeltaPence: number) => {
    try {
      const row = await addModifier({ data: { restaurantId, groupId, name, priceDeltaPence } });
      onGroupsChange(
        groups.map((g) =>
          g.id === groupId ? { ...g, modifiers: [...g.modifiers, row] } : g,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add option");
    }
  };

  const handleDeleteModifier = async (groupId: string, modifierId: string) => {
    try {
      await deleteModifier({ data: { id: modifierId } });
      onGroupsChange(
        groups.map((g) =>
          g.id === groupId
            ? { ...g, modifiers: g.modifiers.filter((m) => m.id !== modifierId) }
            : g,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete option");
    }
  };

  return (
    <div className="space-y-3 py-1">
      {groups.length === 0 && !addingGroup && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No modifier groups yet. Add one below.
        </p>
      )}

      {groups.map((group) => (
        <ModifierGroupCard
          key={group.id}
          group={group}
          onUpdate={(patch) => handleUpdateGroup(group.id, patch)}
          onDelete={() => handleDeleteGroup(group.id)}
          onAddModifier={(name, price) => handleAddModifier(group.id, name, price)}
          onDeleteModifier={(mid) => handleDeleteModifier(group.id, mid)}
        />
      ))}

      {/* New-group inline form */}
      {addingGroup ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddGroup();
              if (e.key === "Escape") { setAddingGroup(false); setNewGroupName(""); }
            }}
            placeholder="Group name, e.g. Size, Extras"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleAddGroup}
            disabled={!newGroupName.trim() || savingGroup}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {savingGroup ? "Adding…" : "Add"}
          </button>
          <button
            type="button"
            onClick={() => { setAddingGroup(false); setNewGroupName(""); }}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingGroup(true)}
          className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add modifier group
        </button>
      )}
    </div>
  );
}

// ─── Modifier Group Card ──────────────────────────────────────────────────────

function ModifierGroupCard({
  group,
  onUpdate,
  onDelete,
  onAddModifier,
  onDeleteModifier,
}: {
  group: DashboardModifierGroup;
  onUpdate: (patch: { name?: string; required?: boolean; maxSelect?: number }) => Promise<void>;
  onDelete: () => Promise<void>;
  onAddModifier: (name: string, priceDeltaPence: number) => Promise<void>;
  onDeleteModifier: (id: string) => Promise<void>;
}) {
  const [editName, setEditName] = useState(group.name);
  const [addingOpt, setAddingOpt] = useState(false);
  const [optName, setOptName] = useState("");
  const [optPrice, setOptPrice] = useState("0.00");
  const [savingOpt, setSavingOpt] = useState(false);

  const handleNameBlur = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== group.name) {
      onUpdate({ name: trimmed }).catch(() => setEditName(group.name));
    } else {
      setEditName(group.name);
    }
  };

  const handleSaveOption = async () => {
    if (!optName.trim()) return;
    const p = parseFloat(optPrice);
    const pence = Number.isNaN(p) ? 0 : Math.round(p * 100);
    setSavingOpt(true);
    try {
      await onAddModifier(optName.trim(), pence);
      setOptName("");
      setOptPrice("0.00");
      setAddingOpt(false);
    } finally {
      setSavingOpt(false);
    }
  };

  const multi = group.max_select > 1;

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      {/* Group header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 border-b border-border">
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameBlur}
          className="flex-1 min-w-0 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground rounded px-1 -mx-1 focus:bg-background focus:ring-1 focus:ring-primary/30 transition-all"
        />
        {/* Required toggle */}
        <button
          type="button"
          onClick={() => onUpdate({ required: !group.required })}
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
            group.required
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {group.required ? "Required" : "Optional"}
        </button>
        {/* Multi-select toggle */}
        <button
          type="button"
          onClick={() => onUpdate({ maxSelect: multi ? 1 : 99 })}
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
            multi
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {multi ? "Multi" : "Single"}
        </button>
        {/* Delete group */}
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Options list */}
      <div className="divide-y divide-border">
        {group.modifiers.map((mod) => (
          <div key={mod.id} className="flex items-center gap-2 px-3 py-2 text-sm">
            <span className="flex-1 min-w-0 truncate">{mod.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {mod.price_delta_pence === 0
                ? "free"
                : `+£${(mod.price_delta_pence / 100).toFixed(2)}`}
            </span>
            <button
              type="button"
              onClick={() => onDeleteModifier(mod.id)}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Add-option form */}
        {addingOpt ? (
          <div className="flex items-center gap-1.5 px-3 py-2">
            <input
              autoFocus
              value={optName}
              onChange={(e) => setOptName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveOption();
                if (e.key === "Escape") { setAddingOpt(false); setOptName(""); setOptPrice("0.00"); }
              }}
              placeholder="Option name"
              className="flex-1 min-w-0 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
            />
            <span className="text-xs text-muted-foreground shrink-0">£</span>
            <input
              value={optPrice}
              onChange={(e) => setOptPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveOption();
                if (e.key === "Escape") { setAddingOpt(false); setOptName(""); setOptPrice("0.00"); }
              }}
              placeholder="0.00"
              className="w-16 shrink-0 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary text-right"
            />
            <button
              type="button"
              onClick={handleSaveOption}
              disabled={!optName.trim() || savingOpt}
              className="shrink-0 rounded-md bg-primary p-1.5 text-primary-foreground disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setAddingOpt(false); setOptName(""); setOptPrice("0.00"); }}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingOpt(true)}
            className="w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Add option
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Menu Row ─────────────────────────────────────────────────────────────────

function MenuRow({
  item,
  categoryId,
  restaurantId,
  onUpdate,
  onOpenEdit,
  onDelete,
}: {
  item: DashboardMenuItem;
  categoryId: string;
  restaurantId: string;
  onUpdate: (id: string, patch: { isAvailable: boolean }) => void;
  onOpenEdit: (item: DashboardMenuItem, categoryId: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const spice =
    item.spice_level > 0 ? SPICE_LEVELS[item.spice_level]?.icon : null;

  const toggle = () => {
    onUpdate(item.id, { isAvailable: !item.is_available });
    toast(`"${item.name}" → ${item.is_available ? "Sold out" : "Available"}`);
  };

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
        <img
          src={item.image_url ?? "/food-placeholder.png"}
          alt={item.name}
          className={`h-full w-full ${item.image_url ? "object-cover" : "object-contain p-2 opacity-40"}`}
        />
        {item.is_featured && (
          <span className="absolute top-0.5 right-0.5 rounded-full bg-amber-400 p-0.5">
            <Star className="h-2.5 w-2.5 text-white fill-white" />
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-medium text-sm leading-tight">{item.name}</p>
          {spice && <span className="text-xs">{spice}</span>}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {item.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {(item.dietary_labels ?? []).map((lbl) => {
            const opt = DIETARY_OPTIONS.find((d) => d.id === lbl);
            return opt ? (
              <span
                key={lbl}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {opt.emoji} {opt.label}
              </span>
            ) : null;
          })}
          {(item.allergens ?? []).length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] text-amber-700">
              ⚠ {item.allergens!.length} allergen
              {item.allergens!.length > 1 ? "s" : ""}
            </span>
          )}
          {item.calories_kcal != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              <Flame className="h-2.5 w-2.5" /> {item.calories_kcal} kcal
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-sm font-semibold tabular-nums">
          {gbp(item.price_pence / 100)}
        </span>
        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-destructive font-medium">Delete?</span>
            <button
              onClick={() => onDelete(item.id)}
              className="text-xs px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground hover:opacity-80 transition-opacity"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={toggle}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                item.is_available
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {item.is_available ? "Available" : "Sold out"}
            </button>
            <button
              onClick={() => onOpenEdit(item, categoryId)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center text-muted-foreground hover:text-destructive transition-colors"
              title="Delete item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── New Category Row ─────────────────────────────────────────────────────────

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
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Check className="h-3.5 w-3.5" /> Add
        </button>
        <button
          onClick={onCancel}
          className="rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Menu Page ────────────────────────────────────────────────────────────────

function MenuPage() {
  const menuData = Route.useLoaderData() as DashboardMenuData | null | undefined;
  const { r } = Route.useSearch();
  const restaurantId = r!;
  const router = useRouter();

  // Modal state: null = closed, { categoryId, item? } = open
  const [modal, setModal] = useState<{
    categoryId: string;
    item?: DashboardMenuItem;
  } | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  // Track which category ID is pending deletion confirmation
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState<string | null>(null);

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

  const handleAddCategory = async (name: string) => {
    try {
      await createDashboardMenuCategory({
        data: { restaurantId, menuId: menuData.menuId, name },
      });
      setAddingCategory(false);
      toast.success(`Category "${name}" added`);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add category");
    }
  };

  const handleToggleAvailable = async (
    id: string,
    patch: { isAvailable: boolean },
  ) => {
    try {
      await updateDashboardMenuItem({ data: { id, isAvailable: patch.isAvailable } });
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    const name = menuData?.categories
      .flatMap((c) => c.items)
      .find((i) => i.id === id)?.name ?? "Item";
    try {
      await deleteDashboardMenuItem({ data: { id } });
      toast.success(`"${name}" deleted`);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete item");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const cat = menuData?.categories.find((c) => c.id === id);
    try {
      await deleteDashboardMenuCategory({ data: { id } });
      toast.success(`"${cat?.name ?? "Category"}" deleted`);
      setConfirmDeleteCategoryId(null);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
      setConfirmDeleteCategoryId(null);
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
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <header className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
              <div>
                <h2 className="font-semibold text-sm">{cat.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {cat.items.length} item{cat.items.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {confirmDeleteCategoryId === cat.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-destructive font-medium">
                      Delete category{cat.items.length > 0 ? ` & ${cat.items.length} item${cat.items.length !== 1 ? "s" : ""}` : ""}?
                    </span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-xs px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground hover:opacity-80 transition-opacity"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteCategoryId(null)}
                      className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteCategoryId(cat.id)}
                    className="inline-flex items-center text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() =>
                    setModal({ categoryId: cat.id })
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" /> Add item
                </button>
              </div>
            </header>

            <div className="divide-y divide-border">
              {cat.items.map((it: DashboardMenuItem) => (
                <MenuRow
                  key={it.id}
                  item={it}
                  categoryId={cat.id}
                  restaurantId={restaurantId}
                  onUpdate={handleToggleAvailable}
                  onOpenEdit={(item, categoryId) =>
                    setModal({ categoryId, item })
                  }
                  onDelete={handleDeleteItem}
                />
              ))}
              {cat.items.length === 0 && (
                <div className="px-5 py-6 text-center text-xs text-muted-foreground">
                  No items yet — click "Add item" to get started.
                </div>
              )}
            </div>
          </section>
        ))}

        {menuData.categories.length === 0 && !addingCategory && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No categories yet. Add one above to get started.
          </div>
        )}
      </div>

      {/* Item Modal */}
      {modal && (
        <ItemModal
          categoryId={modal.categoryId}
          item={modal.item}
          restaurantId={restaurantId}
          onClose={() => setModal(null)}
          onSaved={async () => {
            await router.invalidate();
          }}
        />
      )}
    </>
  );
}
