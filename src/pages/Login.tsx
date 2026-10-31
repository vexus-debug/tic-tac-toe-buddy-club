import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
  FlaskConical,
  Lock,
  Mail,
  Microscope,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import clinexusLogoWhite from "@/assets/site/clinexus-logo-white.png";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";

const DEMO_CLINICS = [
  { label: "Dental Clinic Demo", icon: Stethoscope, slug: "demo", email: "demo@clinexus.com.ng", password: "Thepassword@48" },
  { label: "Eye Clinic Demo", icon: Eye, slug: "eye", email: "demo@clinexus.com.ng", password: "Thepassword@48" },
  { label: "Diagnostic Centre Demo", icon: Microscope, slug: "diagnostic-demo", email: "demo@clinexus.com.ng", password: "Thepassword@48" },
  { label: "Dental Lab Demo", icon: FlaskConical, slug: "dental-lab", email: "demo@clinexus.com.ng", password: "Thepassword@48" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const demoActive = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && session && !demoActive.current) {
      navigate("/app/select-clinic", { replace: true });
    }
  }, [session, authLoading, navigate]);

  const handleDemo = async (clinic: (typeof DEMO_CLINICS)[number]) => {
    demoActive.current = true;
    setDemoLoading(clinic.slug);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: clinic.email,
        password: clinic.password,
      });
      if (error) throw error;
      navigate(`/clinic/${clinic.slug}/dashboard`, { replace: true });
    } catch (error: any) {
      demoActive.current = false;
      toast({ title: "Demo unavailable", description: error.message, variant: "destructive" });
    } finally {
      setDemoLoading(null);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Keep the button busy; the auth listener effect above navigates once
      // the session and memberships have fully loaded.
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <main className="site-theme relative min-h-[100svh] overflow-hidden">
      {/* Gradient mesh backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% 10%, hsl(var(--primary) / 0.22), transparent 60%)," +
            "radial-gradient(50rem 36rem at 85% 20%, hsl(215 70% 45% / 0.28), transparent 60%)," +
            "radial-gradient(46rem 34rem at 20% 85%, hsl(var(--primary) / 0.16), transparent 60%)," +
            "radial-gradient(54rem 40rem at 85% 88%, hsl(280 40% 30% / 0.22), transparent 62%)," +
            "hsl(var(--background))",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "hsl(var(--primary) / 0.45)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{ background: "hsl(215 70% 45% / 0.5)" }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 py-6 sm:px-10">
        <Link to="/" aria-label="Clinexus home" className="inline-flex">
          <img src={clinexusLogoWhite} alt="Clinexus" className="h-8 w-auto sm:h-9" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-foreground/60 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back to website</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      {/* Centered glass card */}
      <div className="relative z-10 flex items-center justify-center px-4 pb-16 pt-6 sm:pt-10">
        <div className="w-full max-w-sm rounded-[2rem] border border-primary/25 bg-card/45 p-8 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-10">
          {/* Avatar */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-primary/25 bg-primary/15">
              <UserRound className="h-12 w-12 text-primary/70" strokeWidth={1.25} />
            </div>
          </div>

          <h1 className="text-center text-2xl font-semibold text-foreground">
            Welcome back
          </h1>
          <p className="mt-1 mb-8 text-center text-sm text-muted-foreground">
            Sign in to your Clinexus workspace
          </p>

          <form onSubmit={handleLogin} className="space-y-7">
            {/* Email — underlined field */}
            <div className="flex items-center gap-3 border-b border-primary/40 pb-2 focus-within:border-primary">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Email ID"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-9 rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Password — underlined field */}
            <div className="flex items-center gap-3 border-b border-primary/40 pb-2 focus-within:border-primary">
              <Lock className="h-4 w-4 shrink-0 text-primary" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="h-9 rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Remember me / Forgot password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                />
                Remember me
              </label>
              <a
                href="https://wa.me/2349017758165?text=Hello%20I%20need%20help%20resetting%20my%20Clinexus%20password"
                target="_blank"
                rel="noopener noreferrer"
                className="italic text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Forgot Password?
              </a>
            </div>

            {/* Gradient sign-in button */}
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-12 w-full rounded-xl border-0 font-semibold tracking-[0.2em] text-primary-foreground uppercase shadow-lg shadow-primary/25 transition-opacity hover:opacity-90"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, hsl(var(--primary) / 0.85), hsl(var(--clinic-teal-light, var(--primary))))",
              }}
            >
              {loading ? "Signing in..." : "Login"}
            </Button>

            {/* Demo clinics */}
            <div className="flex items-center gap-3 pt-1" aria-hidden="true">
              <span className="h-px flex-1 bg-primary/20" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                or explore first
              </span>
              <span className="h-px flex-1 bg-primary/20" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl border-primary/40 bg-transparent"
                  disabled={Boolean(demoLoading)}
                >
                  {demoLoading ? "Opening demo..." : "Try a demo clinic"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Choose a demo clinic</DropdownMenuLabel>
                {DEMO_CLINICS.map((clinic) => (
                  <DropdownMenuItem key={clinic.label} onSelect={() => handleDemo(clinic)} className="gap-2 py-2.5">
                    <clinic.icon className="h-4 w-4 text-primary" />
                    {clinic.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a
              href="https://wa.me/2349017758165?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Create account
            </a>
          </p>
        </div>
      </div>
      <FloatingWhatsAppButton />
    </main>
  );
}
