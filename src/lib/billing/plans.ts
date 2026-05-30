/**
 * Plan definitions and feature-gating helpers.
 * Pure TypeScript — safe to import from client or server code.
 */

export type Plan = "starter" | "growth" | "pro" | "pilot";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "paused";
export type BillingCycle = "monthly" | "yearly";

export type PlanLimits = {
  storefrontPages: number; // -1 = unlimited
  themes: number;
  locations: number;
};

export type PlanFeatureFlags = {
  advancedAnalytics: boolean;
  offers: boolean;
  multipleThemes: boolean;
  customerSegmentation: boolean;
  marketingAutomations: boolean;
  prioritySupport: boolean;
  multiLocation: boolean;
  advancedCRM: boolean;
  aiFeatures: boolean;
  apiAccess: boolean;
  customOnboarding: boolean;
};

export type PlanDefinition = {
  id: Plan;
  name: string;
  monthlyPricePence: number;
  monthlyPriceDisplay: string;
  description: string;
  recommended: boolean;
  billingDisabled: boolean;
  highlights: string[];
  features: PlanFeatureFlags;
  limits: PlanLimits;
};

const FULL_FEATURES: PlanFeatureFlags = {
  advancedAnalytics: true,
  offers: true,
  multipleThemes: true,
  customerSegmentation: true,
  marketingAutomations: true,
  prioritySupport: true,
  multiLocation: true,
  advancedCRM: true,
  aiFeatures: true,
  apiAccess: true,
  customOnboarding: true,
};

const NO_FEATURES: PlanFeatureFlags = {
  advancedAnalytics: false,
  offers: false,
  multipleThemes: false,
  customerSegmentation: false,
  marketingAutomations: false,
  prioritySupport: false,
  multiLocation: false,
  advancedCRM: false,
  aiFeatures: false,
  apiAccess: false,
  customOnboarding: false,
};

export const PLAN_DEFINITIONS: Record<Plan, PlanDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPricePence: 9900,
    monthlyPriceDisplay: "£99",
    description: "Everything you need to start taking direct orders",
    recommended: false,
    billingDisabled: false,
    highlights: [
      "Branded storefront",
      "Direct ordering (pickup + delivery)",
      "QR campaigns",
      "Customer database",
      "Menu management",
      "Basic analytics",
      "3 storefront pages",
      "1 theme",
    ],
    features: { ...NO_FEATURES },
    limits: { storefrontPages: 3, themes: 1, locations: 1 },
  },

  growth: {
    id: "growth",
    name: "Growth",
    monthlyPricePence: 17900,
    monthlyPriceDisplay: "£179",
    description: "Scale your direct ordering with loyalty and automation",
    recommended: true,
    billingDisabled: false,
    highlights: [
      "Everything in Starter",
      "Advanced analytics",
      "Offers & loyalty",
      "Multiple themes",
      "Up to 5 storefront pages",
      "Customer segmentation",
      "Marketing automations",
      "Priority support",
    ],
    features: {
      ...NO_FEATURES,
      advancedAnalytics: true,
      offers: true,
      multipleThemes: true,
      customerSegmentation: true,
      marketingAutomations: true,
      prioritySupport: true,
    },
    limits: { storefrontPages: 5, themes: -1, locations: 1 },
  },

  pro: {
    id: "pro",
    name: "Pro",
    monthlyPricePence: 29900,
    monthlyPriceDisplay: "£299",
    description: "Multi-location power with AI and full API access",
    recommended: false,
    billingDisabled: false,
    highlights: [
      "Everything in Growth",
      "Multi-location support",
      "Advanced CRM",
      "AI features",
      "API access",
      "Custom onboarding",
    ],
    features: { ...FULL_FEATURES },
    limits: { storefrontPages: -1, themes: -1, locations: -1 },
  },

  pilot: {
    id: "pilot",
    name: "Pilot",
    monthlyPricePence: 0,
    monthlyPriceDisplay: "£0",
    description: "Internal pilot — full access, no charge",
    recommended: false,
    billingDisabled: true,
    highlights: ["Unlimited access", "All features", "No charge"],
    features: { ...FULL_FEATURES },
    limits: { storefrontPages: -1, themes: -1, locations: -1 },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPlan(raw: string): Plan {
  if (raw === "starter" || raw === "growth" || raw === "pro" || raw === "pilot")
    return raw;
  return "starter";
}

export function getPlanDef(raw: string): PlanDefinition {
  return PLAN_DEFINITIONS[getPlan(raw)];
}

/** Check whether a plan includes a specific feature flag. */
export function canUseFeature(
  plan: string,
  feature: keyof PlanFeatureFlags,
): boolean {
  return PLAN_DEFINITIONS[getPlan(plan)].features[feature];
}

export function canUseAdvancedAnalytics(plan: string) {
  return canUseFeature(plan, "advancedAnalytics");
}
export function canUseOffers(plan: string) {
  return canUseFeature(plan, "offers");
}
export function canUseMultipleThemes(plan: string) {
  return canUseFeature(plan, "multipleThemes");
}
export function canUseAdditionalPages(plan: string) {
  const limit = PLAN_DEFINITIONS[getPlan(plan)].limits.storefrontPages;
  return limit > 3 || limit === -1;
}

/** -1 means unlimited. */
export function getPageLimit(plan: string): number {
  return PLAN_DEFINITIONS[getPlan(plan)].limits.storefrontPages;
}

export function canAddMorePages(plan: string, currentCount: number): boolean {
  const limit = getPageLimit(plan);
  return limit === -1 || currentCount < limit;
}

/** Days remaining in trial; 0 if expired or not trialing. */
export function getRemainingTrialDays(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function isTrialing(status: string) {
  return status === "trialing";
}

export function isActive(status: string) {
  return (
    status === "active" || status === "trialing" || status === "pilot"
  );
}

const PLAN_ORDER: Plan[] = ["starter", "growth", "pro"];

export function isUpgrade(from: string, to: string): boolean {
  const fi = PLAN_ORDER.indexOf(getPlan(from));
  const ti = PLAN_ORDER.indexOf(getPlan(to));
  return fi !== -1 && ti !== -1 && ti > fi;
}
