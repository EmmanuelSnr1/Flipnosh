import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  saveRestaurantSettings,
  dashboardSearch,
  type DashboardContext,
} from "@/api/dashboard";
import { saveFulfilmentSettings } from "@/api/onboarding";
import { Route as DashboardRoute } from "./dashboard";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  validateSearch: dashboardSearch,
  component: SettingsPage,
});

function SettingsPage() {
  const { restaurant, fulfilment } = DashboardRoute.useLoaderData() as DashboardContext;
  const { r } = Route.useSearch();
  const restaurantId = r!;
  const router = useRouter();

  const [form, setForm] = useState({
    name: restaurant.name ?? "",
    phone: restaurant.phone ?? "",
    address: restaurant.address ?? "",
    postcode: restaurant.postcode ?? "",
    city: restaurant.city ?? "",
    email: restaurant.email ?? "",
    hours: restaurant.hours ?? "",
    pickupEnabled: fulfilment?.pickup_enabled ?? true,
    deliveryEnabled: fulfilment?.delivery_enabled ?? false,
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await saveRestaurantSettings({
        data: {
          restaurantId,
          name: form.name,
          phone: form.phone,
          address: form.address,
          postcode: form.postcode,
          city: form.city,
          email: form.email,
          hours: form.hours,
        },
      });

      // Update fulfilment enabled flags while preserving existing prep/delivery values
      if (fulfilment) {
        await saveFulfilmentSettings({
          data: {
            restaurantId,
            pickupEnabled: form.pickupEnabled,
            deliveryEnabled: form.deliveryEnabled,
            pickupPrepTimeMinutes: fulfilment.pickup_prep_time_minutes,
            deliveryTimeMinutes: fulfilment.delivery_time_minutes,
            deliveryRadiusMiles: fulfilment.delivery_radius_miles,
            deliveryFeePence: fulfilment.delivery_fee_pence,
            minimumDeliveryOrderPence:
              fulfilment.minimum_delivery_order_pence,
          },
        });
      }

      toast.success("Settings saved");
      await router.invalidate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Restaurant profile, hours, and fulfilment."
      />
      <form onSubmit={save} className="p-6 max-w-3xl space-y-6">
        {/* ── Restaurant ── */}
        <Section title="Restaurant">
          <Field
            label="Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          <Field
            label="Email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />
          <Field
            label="Address"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
          />
          <Field
            label="City"
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
          />
          <Field
            label="Postcode"
            value={form.postcode}
            onChange={(v) => setForm({ ...form, postcode: v })}
          />
          <Field
            label="Opening hours"
            value={form.hours}
            onChange={(v) => setForm({ ...form, hours: v })}
            placeholder="e.g. Mon–Sat 11:00–22:00"
          />
        </Section>

        {/* ── Fulfilment ── */}
        <Section title="Fulfilment">
          <Toggle
            label="Pickup enabled"
            checked={form.pickupEnabled}
            onChange={(v) => setForm({ ...form, pickupEnabled: v })}
          />
          <Toggle
            label="Delivery enabled"
            checked={form.deliveryEnabled}
            onChange={(v) => setForm({ ...form, deliveryEnabled: v })}
          />
        </Section>

        {/* ── Storefront ── */}
        <Section title="Storefront">
          <Row
            label="Public URL"
            value={`flipnosh.com/r/${restaurant.slug}`}
          />
          <Row label="Status" value={restaurant.status} />
        </Section>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="px-5 py-3 border-b border-border">
        <h2 className="font-semibold">{title}</h2>
      </header>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-[260px] flex-1 sm:flex-none sm:w-[60%] rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
