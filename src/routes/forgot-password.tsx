import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, AuthInput, AuthButton } from "@/components/shared/AuthShell";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPage });

function ForgotPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to reset it."
      footer={<Link to="/login" className="text-primary font-medium">Back to sign in</Link>}
    >
      <AuthInput label="Email" type="email" placeholder="you@restaurant.com" />
      <AuthButton>Send reset link</AuthButton>
    </AuthShell>
  );
}