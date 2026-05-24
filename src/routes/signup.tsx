import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, AuthInput, AuthButton } from "@/components/shared/AuthShell";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const navigate = useNavigate();
  return (
    <AuthShell
      title="Join the pilot"
      subtitle="Start your branded direct ordering storefront."
      footer={<>Have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link></>}
    >
      <AuthInput label="Restaurant name" placeholder="Natural Fingers" />
      <AuthInput label="Your name" placeholder="Alex" />
      <AuthInput label="Email" type="email" placeholder="you@restaurant.com" />
      <AuthInput label="Password" type="password" placeholder="At least 8 characters" />
      <AuthButton onClick={() => navigate({ to: "/onboarding", search: { step: 1 } })}>
        Create account
      </AuthButton>
    </AuthShell>
  );
}