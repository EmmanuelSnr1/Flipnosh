import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { QrCode, Copy, Check } from "lucide-react";
import { useState } from "react";
import { gbp } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/campaigns")({
  component: CampaignsPage,
});

type Campaign = {
  id: string;
  name: string;
  location: string;
  src: string;
  scans: number;
  orders: number;
  revenue: number;
};

const SLUG = "naturalfingers";
const ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "https://flipnosh.com";

const CAMPAIGNS: Campaign[] = [
  { id: "qr_counter", name: "Counter table tents", location: "Dine-in tables", src: "qr-counter", scans: 482, orders: 124, revenue: 1842 },
  { id: "qr_receipt", name: "Takeaway receipt", location: "Pickup bag", src: "qr-receipt", scans: 1240, orders: 318, revenue: 4730 },
  { id: "qr_flyer", name: "Local flyer drop", location: "Market Square", src: "qr-flyer", scans: 96, orders: 12, revenue: 184 },
];

function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="QR campaigns"
        subtitle="Track scans, orders, and revenue from each QR placement."
      />
      <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAMPAIGNS.map((c) => (
          <CampaignCard key={c.id} c={c} />
        ))}
      </div>
    </>
  );
}

function CampaignCard({ c }: { c: Campaign }) {
  const [copied, setCopied] = useState(false);
  const url = `${ORIGIN}/r/${SLUG}?src=${c.src}`;
  const rate = c.scans ? Math.round((c.orders / c.scans) * 100) : 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{c.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{c.location}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <QrCode className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
        <code className="flex-1 truncate text-xs text-muted-foreground">{url}</code>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-xs font-medium hover:bg-background"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Scans" value={c.scans.toLocaleString()} />
        <Stat label="Orders" value={c.orders.toLocaleString()} />
        <Stat label="Revenue" value={gbp(c.revenue)} />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Conversion rate: <span className="font-medium text-foreground">{rate}%</span>
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-muted py-2">
      <p className="text-base font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}