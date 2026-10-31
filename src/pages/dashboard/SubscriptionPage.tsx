import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  Check, Sparkles, CreditCard, CalendarDays, Users, Stethoscope, Wallet,
   BarChart3, Package, Shield, MessageSquare, ShieldCheck,
} from "lucide-react";

type PlanId = "quarterly" | "biannual" | "annual";

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const plans: {
  id: PlanId;
  name: string;
  price: number;
  months: number;
  cadence: string;
  badge?: string;
  note: string;
}[] = [
  {
    id: "quarterly",
    name: "Quarterly",
    price: 15000,
    months: 3,
    cadence: "every 3 months",
    note: "Best for new clinics testing the waters",
  },
  {
    id: "biannual",
    name: "Half-Yearly",
    price: 30000,
    months: 6,
    cadence: "every 6 months",
    badge: "Most popular",
    note: "Same price per month, fewer renewals to worry about",
  },
  {
    id: "annual",
    name: "Annual",
    price: 60000,
    months: 12,
    cadence: "per year",
    badge: "Best value",
    note: "One payment, a full year of access",
  },
];

const featureGroups: { label: string; icon: any; items: string[] }[] = [
  {
    label: "Patients & Scheduling",
    icon: CalendarDays,
    items: [
      "Unlimited patient records with full profiles & history",
      "Appointment calendar, schedules and staff availability",
      "Waiting list management",
      "Consent forms and document storage",
    ],
  },
  {
    label: "Clinical",
    icon: Stethoscope,
    items: [
      "Treatments and treatment planning",
      "Dental charts",
      "Prescriptions",
      "Lab work tracking",
    ],
  },
  {
    label: "Finance",
    icon: Wallet,
    items: [
      "Billing, invoices and payment recording",
      "Estimates and payment plans",
      "Expenses tracking",
      "Staff commissions and revenue allocation",
      "Profitability reporting",
    ],
  },
  {
    label: "Reports & Analytics",
    icon: BarChart3,
    items: [
      "Standard clinic reports",
      "Advanced analytics dashboards",
    ],
  },
  {
    label: "Inventory & Supply",
    icon: Package,
    items: [
      "Inventory and stock levels",
      "Inventory costs & treatment materials linking",
      "Suppliers and purchase orders",
    ],
  },
  {
    label: "Team & Administration",
    icon: Shield,
    items: [
      "Staff accounts with role-based access",
      "Audit log of activity",
      "Clinic website settings",
      "Shop management",
    ],
  },
  {
    label: "Everyday Essentials",
    icon: MessageSquare,
    items: [
      "Internal messages and notifications",
      "Tutorials and onboarding guides",
      "Clinic settings and branding",
      "Email & chat support",
    ],
  },
];

export default function SubscriptionPage() {
  const [selected, setSelected] = useState<PlanId>("biannual");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        description="Your Clinexus plan — every feature below is included on all timeframes"
      />

      <Card className="glass-card">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-secondary/10 p-2 text-secondary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">No plan active yet</p>
              <p className="text-sm text-muted-foreground">
                Pick a timeframe below to activate your clinic subscription.
              </p>
            </div>
          </div>
          <Badge variant="outline">Trial</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <Card
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`glass-card cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-secondary shadow-lg" : "hover:shadow-md"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.badge && (
                    <Badge className="bg-secondary/15 text-secondary hover:bg-secondary/15">
                      <Sparkles className="mr-1 h-3 w-3" /> {plan.badge}
                    </Badge>
                  )}
                </div>
                <CardDescription>{plan.note}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-semibold">{naira(plan.price)}</span>
                    <span className="pb-1 text-sm text-muted-foreground">{plan.cadence}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ≈ {naira(Math.round(plan.price / plan.months))} / month · billed {plan.cadence}
                  </p>
                </div>
                <Separator />
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-secondary" /> All dashboard features
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-secondary" /> Unlimited patients & staff
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-secondary" /> Email & chat support
                  </li>
                </ul>
                <Button
                  className={`w-full ${isSelected ? "bg-secondary hover:bg-secondary/90" : ""}`}
                  variant={isSelected ? "default" : "outline"}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isSelected ? "Continue to payment" : "Choose plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">What's included</CardTitle>
          <CardDescription>
            Everything your clinic dashboard gives you access to — no feature gates between plans.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featureGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <group.icon className="h-4 w-4 text-secondary" />
                <p className="text-sm font-medium">{group.label}</p>
              </div>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Billing history</CardTitle>
          <CardDescription>Invoices for your Clinexus subscription will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
            <Users className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
