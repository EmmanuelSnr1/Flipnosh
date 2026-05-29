# 🔥 FlipNosh

**FlipNosh** is a white-label direct-ordering platform for independent restaurants. Each restaurant gets its own branded storefront at `/r/{slug}` where customers can browse the menu, customise items, and pay — no third-party marketplace commissions.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Local Development](#local-development)
3. [Environment Variables](#environment-variables)
4. [Project Structure](#project-structure)
5. [Architecture & Key Patterns](#architecture--key-patterns)
6. [Database Schema](#database-schema)
7. [Stripe Integration](#stripe-integration)
8. [Supabase Storage](#supabase-storage)
9. [Deployment (Netlify)](#deployment-netlify)
10. [Feature Status](#feature-status)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) v1 (React 19, SSR) |
| Router | TanStack Router (file-based, type-safe) |
| Database | [Supabase](https://supabase.com) (Postgres + Realtime + Storage) |
| Auth | Supabase Auth (email/password) |
| Payments | [Stripe](https://stripe.com) Checkout + Connect (destination charges) |
| Styling | Tailwind CSS v4 + Radix UI primitives |
| Hosting | [Netlify](https://netlify.com) (SSR via `@netlify/vite-plugin-tanstack-start`) |
| Build | Vite 7 |
| Language | TypeScript 5 |

---

## Local Development

### Prerequisites

- Node.js 22+
- A Supabase project (see `.env` below)
- A Stripe account with Connect enabled
- Stripe CLI (for local webhook testing)

### Install & run

```bash
npm install
npm run dev          # starts at http://localhost:8080
```

### Stripe webhook forwarding (required for payment testing)

Stripe must be able to POST to your local server for checkout sessions and Connect events. Run the Stripe CLI alongside `npm run dev`:

```bash
# Payment webhook (checkout.session.completed etc.)
stripe listen \
  --forward-to http://localhost:8080/api/stripe/payment-webhook \
  --events checkout.session.completed,checkout.session.expired,payment_intent.payment_failed

# Connect webhook (account.updated etc.)
stripe listen \
  --forward-to http://localhost:8080/api/stripe/connect-webhook \
  --events account.updated
```

The CLI prints a `whsec_...` signing secret — paste it into `.env` as `STRIPE_PAYMENT_WEBHOOK_SECRET` and `STRIPE_CONNECT_WEBHOOK_SECRET`.

---

## Environment Variables

Copy `.env` and fill in real values. **Never commit secrets.**

```bash
# ── App ──────────────────────────────────────────────────────────────────────
# Used for Stripe success_url / cancel_url redirects.
# In production Netlify auto-injects $URL; this is only needed locally.
VITE_APP_URL=http://localhost:8080

# ── Supabase ─────────────────────────────────────────────────────────────────
VITE_SUPABASE_URL=https://<ref>.supabase.co     # safe to expose
VITE_SUPABASE_ANON_KEY=eyJ...                   # safe to expose (RLS enforced)

# Server-side only — NEVER use a VITE_ prefix here
SUPABASE_SERVICE_ROLE_KEY=eyJ...                # bypasses RLS; server only

# ── Stripe ───────────────────────────────────────────────────────────────────
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...         # safe to expose
STRIPE_SECRET_KEY=sk_test_...                   # server only
STRIPE_PAYMENT_WEBHOOK_SECRET=whsec_...         # server only
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...         # server only
```

> **Rule:** anything without `VITE_` is server-only and must never be bundled into client code.

---

## Project Structure

```
src/
├── api/                   # TanStack Start server functions (RPC layer)
│   ├── auth.ts            # Sign up, sign in, sign out
│   ├── dashboard.ts       # All dashboard mutations & queries
│   ├── onboarding.ts      # Onboarding wizard saves
│   ├── orders.ts          # Customer-facing order placement
│   ├── payments.ts        # Stripe Checkout session creation
│   ├── storefront.ts      # Public storefront data loading
│   └── stripe-connect.ts  # Connect account creation & onboarding links
│
├── components/
│   ├── admin/             # Internal admin UI
│   ├── dashboard/         # Restaurant dashboard UI components
│   ├── marketing/         # Public marketing pages (nav, footer)
│   ├── onboarding/        # Multi-step onboarding wizard
│   ├── shared/            # Reusable cross-cutting components
│   │   ├── Logo.tsx       # FlipNosh logo (flame icon + wordmark)
│   │   ├── ImageUpload.tsx # Supabase Storage file uploader
│   │   └── AuthShell.tsx  # Auth page wrapper
│   ├── storefront/        # Customer-facing storefront components
│   └── ui/                # Radix-based shadcn/ui primitives
│
├── lib/
│   ├── storefront/        # adapter.ts — maps Supabase rows → typed domain objects
│   ├── stripe/            # server.ts — Stripe SDK singleton
│   ├── supabase/
│   │   ├── client.ts      # Browser Supabase client (anon key)
│   │   ├── server.ts      # Server Supabase client (service role)
│   │   └── storage.ts     # uploadImage() / deleteImage() helpers
│   ├── tenant/            # Slug → restaurant_id resolution
│   └── utils/             # format.ts (gbp, date helpers), cn()
│
├── routes/                # File-based routes (TanStack Router)
│   ├── __root.tsx         # HTML shell, global head tags, favicon
│   ├── index.tsx          # Marketing home page
│   ├── login.tsx / signup.tsx / forgot-password.tsx
│   ├── onboarding.tsx     # Multi-step onboarding wizard
│   ├── dashboard.tsx      # Dashboard layout + auth guard
│   ├── dashboard.*.tsx    # Dashboard sections (menu, orders, storefront…)
│   ├── r.$slug.tsx        # Storefront layout (loads restaurant data)
│   ├── r.$slug.index.tsx  # Storefront home (hero, featured items)
│   ├── r.$slug.menu.tsx   # Full menu & cart
│   ├── r.$slug.checkout.tsx # Checkout (Stripe or cash)
│   ├── r.$slug.success.tsx  # Post-order confirmation
│   ├── order-success.tsx  # Stripe redirect landing (polls payment status)
│   └── admin.tsx          # Internal super-admin panel
│
├── server/                # Raw HTTP handlers (bypass TanStack Start)
│   ├── stripe/
│   │   ├── payment-webhook.ts   # POST /api/stripe/payment-webhook
│   │   └── connect-webhook.ts   # POST /api/stripe/connect-webhook
│   └── …
│
├── server.ts              # Custom Hono/fetch entry point — intercepts webhooks
├── stores/                # mock-store.ts — onboarding wizard local state
└── types/
    ├── index.ts           # Domain types (MenuItem, Order, Restaurant…)
    └── supabase.ts        # Auto-generated Supabase DB types
```

---

## Architecture & Key Patterns

### Server Functions

All data mutations use TanStack Start's `createServerFn`. These compile to RPC endpoints and run on the server — they can safely import `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY`.

```ts
// src/api/dashboard.ts
export const updateDashboardMenuItem = createServerFn({ method: "POST" })
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data }) => { /* runs on server */ });

// usage in a component
await updateDashboardMenuItem({ data: { id, name, pricePence } });
```

**Security rule:** Use `getAdminClient()` (service role) only after verifying the user is an authenticated member of the relevant restaurant. Never use the admin client for auth checks.

### Storefront routing

Each restaurant's storefront lives under `/r/{slug}`. The parent route `r.$slug.tsx` loads all restaurant data once (loader), then child routes consume it via `Route.useLoaderData()`.

```
/r/natural-fingers            → home (hero, featured items)
/r/natural-fingers/menu       → full menu + cart drawer
/r/natural-fingers/checkout   → payment step
/r/natural-fingers/success    → order confirmed
```

### Realtime (orders dashboard)

The orders dashboard subscribes to Supabase Realtime on the `orders` table:
- `INSERT` → new order toast + adds card to board
- `UPDATE` → updates order/payment status live (payment_status flip to `paid` shows "Payment received!")

The `orders` table has `REPLICA IDENTITY FULL` set so UPDATE events include the full old + new row.

### Image uploads

Client-side direct upload to Supabase Storage (no server roundtrip):

```ts
const url = await uploadImage({ bucket: "restaurant-assets", path: `${restaurantId}/logo`, file });
```

RLS on `storage.objects` ensures users can only write to their own restaurant's folder — verified against `restaurant_users.restaurant_id`.

---

## Database Schema

| Table | Purpose |
|---|---|
| `restaurants` | Core restaurant record (name, slug, address, Stripe account) |
| `restaurant_branding` | Logo URL, hero image, tagline, description, socials |
| `restaurant_theme_configs` | Storefront theme, colours, layout settings |
| `restaurant_users` | Restaurant ↔ auth user membership (role: owner/staff) |
| `menus` | Menu container (one per restaurant) |
| `menu_categories` | Category groups (Starters, Mains, etc.) |
| `menu_items` | Individual items with price, image, dietary info |
| `modifier_groups` | Option groups on an item (e.g. "Choose sauce") |
| `modifiers` | Individual options within a group |
| `fulfilment_settings` | Pickup/delivery config, fees, ETAs |
| `orders` | Customer orders (status, payment_status, totals) |
| `order_items` | Line items per order |
| `customers` | Customer records (email, name) |
| `events` | Append-only audit log (order.paid, etc.) |
| `platform_subscriptions` | SaaS billing per restaurant |
| `qr_campaigns` | QR code tracking |

---

## Stripe Integration

FlipNosh uses **Stripe Connect** (destination charges model). Each restaurant is a connected Stripe account; payments flow through FlipNosh's platform account and are routed to the restaurant.

### Connect onboarding

1. Restaurant clicks "Connect Stripe" in dashboard → `createConnectAccount` server function creates a Stripe Connect account and returns an onboarding link.
2. After completing Express onboarding, Stripe fires `account.updated` to `/api/stripe/connect-webhook`.
3. Webhook handler sets `stripe_charges_enabled`, `stripe_payouts_enabled` on the restaurant row.
4. Once both flags are `true`, `canAcceptOnlinePayments = true` and the card payment option appears at checkout.

### Checkout flow

1. Customer selects items, proceeds to checkout, chooses **Card** or **Cash**.
2. Card path → `createCheckoutSession` creates a Stripe Checkout Session with `payment_intent_data.transfer_data.destination` set to the restaurant's Stripe account ID.
3. Customer is redirected to Stripe-hosted checkout.
4. On success, Stripe POSTs `checkout.session.completed` to `/api/stripe/payment-webhook`.
5. Webhook marks the order `payment_status = paid`, advances `status` from `pending` → `accepted`, inserts an `events` record.
6. Customer lands on `/order-success?session_id=cs_...` which polls `getPaymentStatusForOrder` until confirmed.

### Webhook endpoints

| Path | Secret env var | Events handled |
|---|---|---|
| `POST /api/stripe/payment-webhook` | `STRIPE_PAYMENT_WEBHOOK_SECRET` | `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed` |
| `POST /api/stripe/connect-webhook` | `STRIPE_CONNECT_WEBHOOK_SECRET` | `account.updated` |

Both endpoints are intercepted in `src/server.ts` before TanStack Start handles the request, so the raw body is available for signature verification.

---

## Supabase Storage

### Buckets

| Bucket | Path convention | Used for |
|---|---|---|
| `restaurant-assets` | `{restaurantId}/logo.{ext}` · `{restaurantId}/hero.{ext}` | Restaurant logo & hero banner |
| `menu-item-images` | `{restaurantId}/{uuid}.{ext}` | Menu item photos |

Both buckets are **public** (CDN read, no auth required to load images). Write access is restricted by RLS to authenticated users who are members of the relevant restaurant (`restaurant_users` table).

### Upload helper

```ts
import { uploadImage } from "@/lib/supabase/storage";

const publicUrl = await uploadImage({
  bucket: "menu-item-images",
  path: `${restaurantId}/${crypto.randomUUID()}`,
  file,   // File object from <input type="file">
});
```

---

## Deployment (Netlify)

### Build settings

```toml
[build]
  command = "npm run build"
  publish = "dist/client"
```

The `@netlify/vite-plugin-tanstack-start` plugin writes the SSR function to `.netlify/v1/functions/server.mjs` at build time.

### Required environment variables

Set these in **Netlify → Site → Environment variables**:

| Variable | Notes |
|---|---|
| `VITE_SUPABASE_URL` | Public — safe as `VITE_` |
| `VITE_SUPABASE_ANON_KEY` | Public — safe as `VITE_` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — no `VITE_` prefix |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Public — safe as `VITE_` |
| `STRIPE_SECRET_KEY` | **Secret** — no `VITE_` prefix |
| `STRIPE_PAYMENT_WEBHOOK_SECRET` | **Secret** — no `VITE_` prefix |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | **Secret** — no `VITE_` prefix |
| `VITE_APP_URL` | Optional — falls back to Netlify's auto-injected `$URL` |

### Stripe webhook registration (production)

Register both endpoints in the [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks):

```
https://your-site.netlify.app/api/stripe/payment-webhook
  Events: checkout.session.completed, checkout.session.expired, payment_intent.payment_failed

https://your-site.netlify.app/api/stripe/connect-webhook
  Events: account.updated
  Connect: ✓ (listen to events on connected accounts)
```

---

## Feature Status

### ✅ Live

- Restaurant signup & onboarding wizard (7 steps)
- Branded customer storefront per restaurant (`/r/{slug}`)
- Full menu with categories, items, dietary labels, allergens, modifiers, spice levels
- Cart (drawer, sidebar, bottom-bar modes)
- Checkout — Stripe Checkout (card) + cash on collection/delivery
- Stripe Connect — restaurant onboarding, destination charges
- Payment webhooks — auto-mark orders paid, advance status
- Order success page with real-time payment status polling
- Restaurant dashboard — orders board with Realtime updates
- Dashboard — menu management (add/edit/delete items, categories, modifier groups)
- Dashboard — storefront customiser (theme, colours, layout, branding)
- Image uploads — logo, hero banner, menu item photos (Supabase Storage)
- Favicon — SVG matching the FlipNosh logo (`/public/favicon.svg`)

### 🔜 Planned

- SaaS billing (Stripe Billing — restaurant subscriptions)
- Kitchen display system / order status tracking for customers
- Customer accounts & order history
- Delivery driver assignment flow
- Refunds via dashboard
- Multi-location support
- Analytics & revenue reporting
