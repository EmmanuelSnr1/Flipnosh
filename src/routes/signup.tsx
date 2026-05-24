import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { signUpAndCreateRestaurant } from "@/api/auth";
import { toast } from "sonner";
import { Flame } from "lucide-react";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("");
  const [yourName, setYourName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // 1. Create Supabase auth user (client-side — browser persists the session)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Sign-up succeeded but no user ID returned.");

      // 2. Derive a URL-safe slug from the restaurant name
      const baseSlug = restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 28);
      const slug = baseSlug || "restaurant";

      // 3. Create restaurant + seed config rows via admin client (server fn)
      const restaurant = await signUpAndCreateRestaurant({
        data: { userId, restaurantName: restaurantName.trim(), slug },
      });

      toast.success("Account created — let's set up your storefront!");
      navigate({
        to: "/onboarding",
        search: { step: 2, restaurantId: restaurant.id },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      // Supabase surfaces "User already registered" for duplicate emails
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="h-4 w-4" />
          </span>
          <span className="font-bold">FlipNosh</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold">Join the pilot</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start your branded direct ordering storefront.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <AuthField
              label="Restaurant name"
              value={restaurantName}
              onChange={setRestaurantName}
              placeholder="Natural Fingers"
              required
            />
            <AuthField
              label="Your name"
              value={yourName}
              onChange={setYourName}
              placeholder="Alex"
            />
            <AuthField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@restaurant.com"
              required
            />
            <AuthField
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Have an account?{" "}
            <Link to="/login" className="text-primary font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function AuthField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
