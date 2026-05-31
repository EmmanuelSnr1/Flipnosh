import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { store, useStore } from "@/stores/mock-store";
import { StepShell, STEPS } from "@/components/onboarding/StepShell";
import { LivePreview } from "@/components/onboarding/LivePreview";
import {
  WelcomeStep,
  RestaurantInfoStep,
  DesignStep,
  MenuStep,
  FulfilmentStep,
  PaymentsStep,
  PreviewStep,
  CompletedStep,
} from "@/components/onboarding/steps";
import { toast } from "sonner";
import {
  saveRestaurantInfo,
  saveBranding,
  saveThemeConfig,
  saveFulfilmentSettings,
  markOnboardingComplete,
} from "@/api/onboarding";

// ─── Route definition ─────────────────────────────────────────────────────────

export const Route = createFileRoute("/onboarding")({
  validateSearch: (s: Record<string, unknown>) => ({
    step: typeof s.step === "number" ? s.step : Number(s.step) || undefined,
    /** Present when coming from real signup — persisted across navigation steps */
    restaurantId:
      typeof s.restaurantId === "string" ? s.restaurantId : undefined,
    /** Real DB slug returned by signUpAndCreateRestaurant — shown on CompletedStep */
    slug: typeof s.slug === "string" ? s.slug : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Setup · FlipNosh" },
      {
        name: "description",
        content: "Launch your direct-ordering storefront in minutes.",
      },
    ],
  }),
  component: OnboardingPage,
});

// ─── Pilot constant: the mock restaurant slug used by step components ─────────

const PILOT_SLUG = "naturalfingers";

// ─── Page component ───────────────────────────────────────────────────────────

function OnboardingPage() {
  const { step: stepParam, restaurantId, slug: realSlug } = Route.useSearch();
  const { onboarding, restaurants } = useStore();
  const navigate = useNavigate();

  const step = Math.min(Math.max(stepParam ?? onboarding.currentStep ?? 1, 1), STEPS.length);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    store.updateOnboarding({ currentStep: step });
  }, [step]);

  // Preserve restaurantId and slug in every navigation inside the onboarding flow
  const goTo = (n: number) => {
    navigate({ to: "/onboarding", search: { step: n, restaurantId, slug: realSlug } });
  };

  // ─── Per-step Supabase saves ─────────────────────────────────────────────

  const saveStep = async (currentStep: number) => {
    if (!restaurantId) return; // no real account yet — stay in mock-only mode

    const r = restaurants.find((x) => x.slug === PILOT_SLUG);
    if (!r) return;

    switch (currentStep) {
      case 2: {
        // Restaurant info + branding
        await Promise.all([
          saveRestaurantInfo({
            data: {
              restaurantId,
              name: r.name,
              city: r.city,
              address: r.address,
              postcode: r.postcode,
              phone: r.phone,
              email: r.branding.email,
            },
          }),
          saveBranding({
            data: {
              restaurantId,
              tagline: r.branding.tagline,
              description: r.branding.description,
              // Images are uploaded immediately on pick; include here as a
              // best-effort persist in case the DB write was missed.
              ...(r.branding.logoUrl && !r.branding.logoUrl.startsWith("blob:")
                ? { logoUrl: r.branding.logoUrl }
                : {}),
              ...(r.branding.heroImageUrl && !r.branding.heroImageUrl.startsWith("blob:")
                ? { heroImageUrl: r.branding.heroImageUrl }
                : {}),
              instagramUrl: r.branding.socials?.instagram,
              tiktokUrl: r.branding.socials?.tiktok,
              facebookUrl: r.branding.socials?.facebook,
            },
          }),
        ]);
        break;
      }

      case 3: {
        // Storefront theme + layout config
        const t = r.theme;
        await saveThemeConfig({
          data: {
            restaurantId,
            themeName: t.themeName,
            primaryColor: t.primaryColor,
            accentColor: t.accentColor,
            backgroundColor: t.backgroundColor,
            buttonColor: t.buttonColor,
            textColor: t.textColor,
            heroLayout: t.heroLayout,
            menuLayout: t.menuLayout,
            categoryNavigation: t.categoryNavigation,
            cartStyle: t.cartStyle,
            showFeaturedItems: t.showFeaturedItems,
            showOpeningHours: t.showOpeningHours,
            showBadges: t.showBadges,
            showReviews: t.showReviews,
            ctaText: t.ctaText,
            enabledPages: t.enabledPages as string[],
          },
        });
        break;
      }

      case 4:
        // Menu step — categories/items have complex mutations.
        // Supabase menu save is handled separately in the menu builder (Phase 2).
        break;

      case 5: {
        // Fulfilment settings
        const f = r.fulfilment;
        await saveFulfilmentSettings({
          data: {
            restaurantId,
            pickupEnabled: f.pickup.enabled,
            deliveryEnabled: f.delivery.enabled,
            pickupPrepTimeMinutes: f.pickup.prepTimeMinutes,
            deliveryTimeMinutes: f.delivery.etaMinutes,
            deliveryRadiusMiles: f.delivery.radiusMiles,
            // Convert £ floats → integer pence for DB storage
            deliveryFeePence: Math.round(f.delivery.fee * 100),
            minimumDeliveryOrderPence: Math.round(f.delivery.minimumOrder * 100),
          },
        });
        break;
      }

      case 6:
        // Payments step — Stripe is Phase 2; nothing to save
        break;

      default:
        break;
    }
  };

  // ─── Navigation helpers ───────────────────────────────────────────────────

  const next = async () => {
    if (saving) return;

    if (restaurantId) {
      setSaving(true);
      try {
        await saveStep(step);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Save failed";
        toast.error(`${msg} — changes not saved to server`);
        setSaving(false);
        return; // Don't advance if save failed
      }
      setSaving(false);
    }

    store.completeStep(step);
    goTo(Math.min(step + 1, STEPS.length));
  };

  const back = step > 1 ? () => goTo(step - 1) : undefined;

  const handleLaunch = async () => {
    if (saving) return;

    if (restaurantId) {
      setSaving(true);
      try {
        await markOnboardingComplete({ data: restaurantId });
      } catch (err) {
        toast.error("Launch failed — please try again");
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    store.launchStorefront();
    toast.success("🎉 Storefront launched!");
    goTo(8);
  };

  // ─── Step rendering ───────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <StepShell
        step={1}
        completed={onboarding.completedSteps}
        goTo={goTo}
        title="Let's get you live"
        subtitle="A short, guided setup — you can change anything later."
        hideNav
      >
        <WelcomeStep
          onStart={() => {
            store.completeStep(1);
            goTo(2);
          }}
        />
      </StepShell>
    );
  }

  if (step === 2) {
    return (
      <StepShell
        step={2}
        completed={onboarding.completedSteps}
        goTo={goTo}
        title="Restaurant info"
        subtitle="The basics customers need to find and trust you."
        preview={<LivePreview />}
        onBack={back}
        onNext={next}
        nextLoading={saving}
      >
        <RestaurantInfoStep restaurantId={restaurantId} />
      </StepShell>
    );
  }

  if (step === 3) {
    return (
      <StepShell
        step={3}
        completed={onboarding.completedSteps}
        goTo={goTo}
        title="Storefront design"
        subtitle="Pick a theme and tweak colours, layout, and pages."
        preview={<LivePreview />}
        onBack={back}
        onNext={next}
        nextLoading={saving}
      >
        <DesignStep />
      </StepShell>
    );
  }

  if (step === 4) {
    return (
      <StepShell
        step={4}
        completed={onboarding.completedSteps}
        goTo={goTo}
        title="Build your menu"
        subtitle="Add categories, items, prices and photos."
        preview={<LivePreview path="/menu" />}
        onBack={back}
        onNext={next}
        nextLoading={saving}
      >
        <MenuStep />
      </StepShell>
    );
  }

  if (step === 5) {
    return (
      <StepShell
        step={5}
        completed={onboarding.completedSteps}
        goTo={goTo}
        title="Fulfilment"
        subtitle="Choose pickup, delivery, prep times and delivery rules."
        preview={<LivePreview />}
        onBack={back}
        onNext={next}
        nextLoading={saving}
      >
        <FulfilmentStep />
      </StepShell>
    );
  }

  if (step === 6) {
    return (
      <StepShell
        step={6}
        completed={onboarding.completedSteps}
        goTo={goTo}
        title="Get paid"
        subtitle="Connect Stripe to receive payouts directly to your bank."
        onBack={back}
        onNext={next}
        nextLoading={saving}
      >
        <PaymentsStep restaurantId={restaurantId} />
      </StepShell>
    );
  }

  if (step === 7) {
    return (
      <StepShell
        step={7}
        completed={onboarding.completedSteps}
        goTo={goTo}
        title="Preview & launch"
        subtitle="One last look before your storefront goes live."
        preview={<LivePreview />}
        onBack={back}
        hideNav
      >
        <PreviewStep onLaunch={handleLaunch} launchLoading={saving} />
      </StepShell>
    );
  }

  return (
    <StepShell
      step={8}
      completed={onboarding.completedSteps}
      goTo={goTo}
      title="You're live"
      hideNav
    >
      <CompletedStep
        restaurantSlug={realSlug}
        onGoToDashboard={() =>
          navigate({ to: "/dashboard", search: { r: restaurantId } })
        }
      />
    </StepShell>
  );
}
