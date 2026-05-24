import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { store, useStore } from "@/lib/mock-store";
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

export const Route = createFileRoute("/onboarding")({
  validateSearch: (s: Record<string, unknown>) => ({
    step: typeof s.step === "number" ? s.step : Number(s.step) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Setup · FlipNosh" },
      { name: "description", content: "Launch your direct-ordering storefront in minutes." },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { step: stepParam } = Route.useSearch();
  const { onboarding } = useStore();
  const navigate = useNavigate();
  const step = Math.min(Math.max(stepParam ?? onboarding.currentStep ?? 1, 1), STEPS.length);

  useEffect(() => {
    store.updateOnboarding({ currentStep: step });
  }, [step]);

  const goTo = (n: number) => {
    navigate({ to: "/onboarding", search: { step: n } });
  };
  const next = () => {
    store.completeStep(step);
    goTo(Math.min(step + 1, STEPS.length));
  };
  const back = step > 1 ? () => goTo(step - 1) : undefined;

  // Render
  if (step === 1) {
    return (
      <StepShell step={1} completed={onboarding.completedSteps} goTo={goTo}
        title="Let's get you live" subtitle="A short, guided setup — you can change anything later." hideNav>
        <WelcomeStep onStart={() => { store.completeStep(1); goTo(2); }} />
      </StepShell>
    );
  }

  if (step === 2) {
    return (
      <StepShell step={2} completed={onboarding.completedSteps} goTo={goTo}
        title="Restaurant info" subtitle="The basics customers need to find and trust you."
        preview={<LivePreview />} onBack={back} onNext={next}>
        <RestaurantInfoStep />
      </StepShell>
    );
  }

  if (step === 3) {
    return (
      <StepShell step={3} completed={onboarding.completedSteps} goTo={goTo}
        title="Storefront design" subtitle="Pick a theme and tweak colours, layout, and pages."
        preview={<LivePreview />} onBack={back} onNext={next}>
        <DesignStep />
      </StepShell>
    );
  }

  if (step === 4) {
    return (
      <StepShell step={4} completed={onboarding.completedSteps} goTo={goTo}
        title="Build your menu" subtitle="Add categories, items, prices and photos."
        preview={<LivePreview path="/menu" />} onBack={back} onNext={next}>
        <MenuStep />
      </StepShell>
    );
  }

  if (step === 5) {
    return (
      <StepShell step={5} completed={onboarding.completedSteps} goTo={goTo}
        title="Fulfilment" subtitle="Choose pickup, delivery, prep times and delivery rules."
        preview={<LivePreview />} onBack={back} onNext={next}>
        <FulfilmentStep />
      </StepShell>
    );
  }

  if (step === 6) {
    return (
      <StepShell step={6} completed={onboarding.completedSteps} goTo={goTo}
        title="Get paid" subtitle="Connect Stripe to receive payouts directly to your bank."
        onBack={back} onNext={next}>
        <PaymentsStep />
      </StepShell>
    );
  }

  if (step === 7) {
    return (
      <StepShell step={7} completed={onboarding.completedSteps} goTo={goTo}
        title="Preview & launch" subtitle="One last look before your storefront goes live."
        preview={<LivePreview />} onBack={back} hideNav>
        <PreviewStep onLaunch={() => {
          store.launchStorefront();
          toast.success("🎉 Storefront launched!");
          goTo(8);
        }} />
      </StepShell>
    );
  }

  return (
    <StepShell step={8} completed={onboarding.completedSteps} goTo={goTo}
      title="You're live" hideNav>
      <CompletedStep onGoToDashboard={() => navigate({ to: "/dashboard" })} />
    </StepShell>
  );
}