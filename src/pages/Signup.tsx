import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { clinicTypeOptions } from "@/config/clinicTypeConfig";
import { createClinicForUser } from "@/lib/createClinic";
import clinexusLogo from "@/assets/site/clinexus-logo.png";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicType, setClinicType] = useState("dental");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && session) {
      navigate("/select-clinic", { replace: true });
    }
  }, [session, authLoading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const clinicMeta = {
        full_name: fullName,
        phone,
        clinic_name: clinicName,
        clinic_type: clinicType,
        clinic_phone: phone,
        clinic_address: clinicAddress,
        clinic_email: email,
      };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/select-clinic`,
          data: clinicMeta,
        },
      });
      if (error) throw error;

      if (data.session && data.user) {
        await supabase
          .from("profiles")
          .update({ full_name: fullName, phone })
          .eq("id", data.user.id);

        const { slug } = await createClinicForUser(data.user.id, {
          clinic_name: clinicName,
          clinic_type: clinicType,
          clinic_phone: phone,
          clinic_address: clinicAddress,
          clinic_email: email,
        });
        toast({ title: "Clinic created", description: `${clinicName} is ready.` });
        navigate(`/clinic/${slug}/dashboard`, { replace: true });
      } else {
        toast({ title: "Check your email", description: "Confirm your address to finish setting up your clinic." });
        navigate("/login", { replace: true });
      }
    } catch (error: any) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 overflow-y-auto py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/20 pointer-events-none" />

      <Card className="relative w-full max-w-lg border-border/40 shadow-2xl shadow-primary/[0.08] backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-3 pb-2">
          <img src={clinexusLogo} alt="Clinexus" className="w-48 h-auto object-contain mx-auto mix-blend-multiply dark:mix-blend-screen" />
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">Create your clinic account</CardTitle>
            <CardDescription className="mt-1">Set up your clinic on Clinexus</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label>Clinic type</Label>
              <div className="grid grid-cols-2 gap-2">
                {clinicTypeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const selected = clinicType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={opt.comingSoon}
                      onClick={() => setClinicType(opt.value)}
                      className={`relative flex items-start gap-2 rounded-lg border p-3 text-left transition-colors ${
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      } ${opt.comingSoon ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">{opt.label}</p>
                        {opt.comingSoon ? (
                          <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">Coming soon</Badge>
                        ) : (
                          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{opt.description}</p>
                        )}
                      </div>
                      {selected && <Check className="h-4 w-4 text-primary absolute top-2 right-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic name</Label>
              <Input id="clinicName" placeholder="Bright Smile Dental" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicAddress">Clinic address</Label>
              <Textarea id="clinicAddress" placeholder="12 Marina Road, Lagos" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} required maxLength={300} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" placeholder="Dr. Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" type="tel" placeholder="+234 800 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={30} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full font-semibold shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? "Creating clinic..." : "Create clinic account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
