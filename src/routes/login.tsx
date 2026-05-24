import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, AuthInput, AuthButton } from "@/components/shared/AuthShell";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your FlipNosh dashboard."
      footer={<>No account? <Link to="/signup" className="text-primary font-medium">Sign up</Link></>}
    >
      <AuthInput label="Email" type="email" placeholder="you@restaurant.com" />
      <AuthInput label="Password" type="password" placeholder="••••••••" />
      <div className="text-right text-xs">
        <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">Forgot password?</Link>
      </div>
      <AuthButton>Sign in</AuthButton>
    </AuthShell>
  );
}