import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { store, useStore } from "@/lib/mock-store";
import { toast } from "sonner";

const SLUG = "naturalfingers";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { restaurants } = useStore();
  const r = restaurants.find((x) => x.slug === SLUG)!;

  const [form, setForm] = useState({
    name: r.name,
    phone: r.phone,
    address: r.address,
    postcode: r.postcode,
    hours: r.hours,
    pickupEnabled: r.pickupEnabled,
    deliveryEnabled: r.deliveryEnabled,
  });

  // Keep form in sync if store changes externally.
  useEffect(() => {
    setForm({
      name: r.name,
      phone: r.phone,
      address: r.address,
      postcode: r.postcode,
      hours: r.hours,
      pickupEnabled: r.pickupEnabled,
      deliveryEnabled: r.deliveryEnabled,
    });
  }, [r.name, r.phone, r.address, r.postcode, r.hours, r.pickupEnabled, r.deliveryEnabled]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateRestaurant(SLUG, form);
    toast.success("Settings saved");
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Restaurant profile, hours, and storefront." />
      <form onSubmit={save} className="p-6 max-w-3xl space-y-6">
        <Section title="Restaurant">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          <Field label="Postcode" value={form.postcode} onChange={(v) => setForm({ ...form, postcode: v })} />
        </Section>

        <Section title="Fulfilment">
          <Field label="Opening hours" value={form.hours} onChange={(v) => setForm({ ...form, hours: v })} />
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

        <Section title="Storefront">
          <Row label="Public URL" value={`flipnosh.com/r/${r.slug}`} />
          <Row label="Brand color" value={r.brandColor} />
        </Section>

        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Save changes
        </button>
      </form>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
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