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

// ── Opening-hours helpers ────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof DAYS)[number];
type DayHours = { open: boolean; from: string; to: string };
type WeekHours = Record<Day, DayHours>;

const DEFAULT_WEEK: WeekHours = {
  Mon: { open: true,  from: "11:00", to: "22:00" },
  Tue: { open: true,  from: "11:00", to: "22:00" },
  Wed: { open: true,  from: "11:00", to: "22:00" },
  Thu: { open: true,  from: "11:00", to: "22:00" },
  Fri: { open: true,  from: "11:00", to: "22:00" },
  Sat: { open: true,  from: "12:00", to: "22:00" },
  Sun: { open: false, from: "12:00", to: "21:00" },
};

/** 30-minute time slots 00:00 → 23:30 */
const TIME_OPTIONS = (() => {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      opts.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      );
    }
  }
  return opts;
})();

/** Serialise WeekHours → "Mon–Fri 11:00–22:00, Sat 12:00–21:00" */
function hoursToString(week: WeekHours): string {
  const groups: { days: Day[]; from: string; to: string }[] = [];
  for (const day of DAYS) {
    const { open, from, to } = week[day];
    if (!open) continue;
    const last = groups[groups.length - 1];
    if (last && last.from === from && last.to === to) {
      last.days.push(day);
    } else {
      groups.push({ days: [day], from, to });
    }
  }
  const parts = groups.map(({ days, from, to }) => {
    const label =
      days.length === 1 ? days[0] : `${days[0]}–${days[days.length - 1]}`;
    return `${label} ${from}–${to}`;
  });
  return parts.length ? parts.join(", ") : "Closed";
}

/**
 * Parse a stored hours string back to WeekHours.
 * Understands "Mon–Fri 11:00–22:00, Sat 12:00–21:00".
 * Falls back to DEFAULT_WEEK if nothing parses.
 */
function parseHoursString(str: string): WeekHours {
  if (!str) return JSON.parse(JSON.stringify(DEFAULT_WEEK)) as WeekHours;

  const segments = str.split(/,\s*/);
  const entries: { day: Day; from: string; to: string }[] = [];

  for (const seg of segments) {
    // Accepts both en-dash (–) and hyphen (-) as separators
    const match = seg
      .trim()
      .match(
        /^([A-Za-z]{2,3})(?:[–\-]([A-Za-z]{2,3}))?\s+(\d{1,2}:\d{2})[–\-](\d{1,2}:\d{2})$/,
      );
    if (!match) continue;
    const [, startDay, endDay, rawFrom, rawTo] = match;
    const pad = (t: string) => (t.length === 4 ? `0${t}` : t);
    const from = pad(rawFrom);
    const to   = pad(rawTo);

    const si = (DAYS as readonly string[]).indexOf(startDay);
    if (si === -1) continue;
    const ei = endDay ? (DAYS as readonly string[]).indexOf(endDay) : si;
    if (ei === -1) continue;

    for (let i = si; i <= ei; i++) {
      entries.push({ day: DAYS[i], from, to });
    }
  }

  // Nothing recognised → return defaults so the UI is pre-filled sensibly
  if (!entries.length) return JSON.parse(JSON.stringify(DEFAULT_WEEK)) as WeekHours;

  // Build result: start all-closed, then apply parsed entries
  const result = {} as WeekHours;
  for (const d of DAYS) result[d] = { open: false, from: "11:00", to: "22:00" };
  for (const { day, from, to } of entries) {
    result[day] = { open: true, from, to };
  }
  return result;
}

// ── Main page ─────────────────────────────────────────────────────────────────

function SettingsPage() {
  const { restaurant, fulfilment } = DashboardRoute.useLoaderData() as DashboardContext;
  const { r } = Route.useSearch();
  const restaurantId = r!;
  const router = useRouter();

  const [form, setForm] = useState({
    name:            restaurant.name     ?? "",
    phone:           restaurant.phone    ?? "",
    address:         restaurant.address  ?? "",
    postcode:        restaurant.postcode ?? "",
    city:            restaurant.city     ?? "",
    email:           restaurant.email    ?? "",
    hours:           restaurant.hours    ?? "",
    pickupEnabled:   fulfilment?.pickup_enabled   ?? true,
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
          name:     form.name,
          phone:    form.phone,
          address:  form.address,
          postcode: form.postcode,
          city:     form.city,
          email:    form.email,
          hours:    form.hours,
        },
      });

      if (fulfilment) {
        await saveFulfilmentSettings({
          data: {
            restaurantId,
            pickupEnabled:               form.pickupEnabled,
            deliveryEnabled:             form.deliveryEnabled,
            pickupPrepTimeMinutes:       fulfilment.pickup_prep_time_minutes,
            deliveryTimeMinutes:         fulfilment.delivery_time_minutes,
            deliveryRadiusMiles:         fulfilment.delivery_radius_miles,
            deliveryFeePence:            fulfilment.delivery_fee_pence,
            minimumDeliveryOrderPence:   fulfilment.minimum_delivery_order_pence,
          },
        });
      }

      toast.success("Settings saved");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
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
          <Field label="Name"     value={form.name}     onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Phone"    value={form.phone}    onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Email"    value={form.email}    onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Address"  value={form.address}  onChange={(v) => setForm({ ...form, address: v })} />
          <Field label="City"     value={form.city}     onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="Postcode" value={form.postcode} onChange={(v) => setForm({ ...form, postcode: v })} />

          {/* Opening hours — structured day-toggle + time-picker */}
          <div className="px-5 py-4">
            <p className="text-sm text-muted-foreground mb-3">Opening hours</p>
            <HoursEditor
              value={form.hours}
              onChange={(v) => setForm({ ...form, hours: v })}
            />
          </div>
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
          <Row label="Public URL" value={`flipnosh.com/r/${restaurant.slug}`} />
          <Row label="Status"     value={restaurant.status} />
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

// ── Opening-hours editor ──────────────────────────────────────────────────────

function HoursEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [week, setWeek] = useState<WeekHours>(() => parseHoursString(value));

  const update = (day: Day, patch: Partial<DayHours>) => {
    const next: WeekHours = { ...week, [day]: { ...week[day], ...patch } };
    setWeek(next);
    onChange(hoursToString(next));
  };

  return (
    <div className="space-y-0.5">
      {DAYS.map((day) => {
        const { open, from, to } = week[day];
        return (
          <div key={day} className="flex flex-wrap items-center gap-2 py-1.5">
            {/* Day toggle */}
            <button
              type="button"
              onClick={() => update(day, { open: !open })}
              aria-label={open ? `Close ${day}` : `Open ${day}`}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                open ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  open ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>

            {/* Day label */}
            <span className={`w-7 text-sm font-medium shrink-0 ${open ? "text-foreground" : "text-muted-foreground"}`}>
              {day}
            </span>

            {/* Time pickers or Closed badge */}
            {open ? (
              <div className="flex items-center gap-1.5">
                <select
                  value={from}
                  aria-label={`${day} opens at`}
                  onChange={(e) => update(day, { from: e.target.value })}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground select-none">–</span>
                <select
                  value={to}
                  aria-label={`${day} closes at`}
                  onChange={(e) => update(day, { to: e.target.value })}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Closed</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

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
