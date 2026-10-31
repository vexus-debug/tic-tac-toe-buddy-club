import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/hooks/useOrg";
import { useSurgeryBookings } from "@/hooks/eye/useEye";
import { useTodayFlow, usePickupOrders, useUnpaidInvoices, useFrames, useLenses, FLOW_STAGES, todayISO } from "@/hooks/eye/useEyeOps";
import { hasPageAccess } from "@/config/roleAccess";
import { ArrowRight, ArrowUpRight, UserPlus } from "lucide-react";

const ngn = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

type Tone = "default" | "success" | "warning" | "info" | "destructive";

const toneText: Record<Tone, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  destructive: "text-destructive",
};

const toneBar: Record<Tone, string> = {
  default: "bg-foreground/70",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  destructive: "bg-destructive",
};

interface MetricProps {
  path: string;
  label: string;
  value: number | string;
  sub: string;
  tone?: Tone;
}

export function EyeTodayScreen() {
  const { basePath, currentOrg } = useOrg();
  const role = currentOrg?.role || "receptionist";
  const can = (p: string) => hasPageAccess(role, p, "eye");
  const { data: flow = [] } = useTodayFlow();
  const { data: pickups = [] } = usePickupOrders();
  const { data: unpaid = [] } = useUnpaidInvoices();
  const { data: surgeries = [] } = useSurgeryBookings();
  const { data: frames = [] } = useFrames();
  const { data: lenses = [] } = useLenses();

  const active = flow.filter((f) => !["completed", "cancelled", "no_show"].includes(f.status));
  const ready = pickups.filter((o) => o.status === "ready");
  const notTold = ready.filter((o) => !o.notified_at);
  const atLab = pickups.filter((o) => o.status !== "ready");
  const todaySurg = surgeries.filter((s) => s.scheduled_date?.slice(0, 10) === todayISO() && s.status !== "cancelled");
  const lowStock = frames.filter((f) => f.quantity <= f.reorder_level).length + lenses.filter((l) => l.quantity <= l.reorder_level).length;
  const unpaidTotal = unpaid.reduce((s, i) => s + Number(i.total || 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const metrics = [
    { path: "eye/flow", label: "In clinic now", value: active.length, sub: `${flow.length - active.length} finished today`, tone: "default" },
    { path: "eye/pickup", label: "Glasses ready", value: ready.length, sub: `${notTold.length} unnotified · ${atLab.length} at lab`, tone: "success" },
    { path: "billing", label: "Unpaid bills", value: unpaid.length, sub: ngn.format(unpaidTotal), tone: (unpaid.length ? "destructive" : "default") as Tone },
    { path: "eye/surgery", label: "Surgeries today", value: todaySurg.length, sub: todaySurg.map((s) => s.procedure_name).slice(0, 2).join(", ") || "None booked", tone: "info" },
    { path: "eye/stock", label: "Low stock items", value: lowStock, sub: "Frames & lenses to reorder", tone: (lowStock ? "warning" : "default") as Tone },
  ].filter((m) => can(m.path)) as MetricProps[];

  const stageData = FLOW_STAGES.map((st) => ({
    ...st,
    list: active.filter((f) => f.stage === st.key),
  }));
  const maxStage = Math.max(1, ...stageData.map((s) => s.list.length));

  const attention = [
    notTold.length > 0 && can("eye/pickup") && {
      label: "Ready glasses not collected",
      detail: `${notTold.length} ${notTold.length === 1 ? "patient" : "patients"} not yet notified`,
      to: `${basePath}/eye/pickup`,
      tone: "warning" as Tone,
    },
    unpaid.length > 0 && can("billing") && {
      label: "Outstanding balances",
      detail: `${unpaid.length} ${unpaid.length === 1 ? "bill" : "bills"} · ${ngn.format(unpaidTotal)}`,
      to: `${basePath}/billing`,
      tone: "destructive" as Tone,
    },
    lowStock > 0 && can("eye/stock") && {
      label: "Stock below reorder level",
      detail: `${lowStock} ${lowStock === 1 ? "item" : "items"} need reordering`,
      to: `${basePath}/eye/stock`,
      tone: "warning" as Tone,
    },
  ].filter(Boolean) as { label: string; detail: string; to: string; tone: Tone }[];

  const pickupTotal = ready.length + atLab.length;
  const readyPct = pickupTotal ? Math.round((ready.length / pickupTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{dateStr}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{greeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {active.length > 0
              ? `${active.length} ${active.length === 1 ? "patient" : "patients"} currently in the clinic`
              : "No patients in the clinic yet"}
          </p>
        </div>
        {can("eye/flow") && (
          <Button size="sm" asChild>
            <Link to={`${basePath}/eye/flow`}>
              <UserPlus className="mr-1.5 h-4 w-4" />Check in a patient
            </Link>
          </Button>
        )}
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
        {metrics.map((m) => (
          <Link
            key={m.path}
            to={`${basePath}/${m.path}`}
            className="group relative px-4 py-4 transition-colors hover:bg-accent/50"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p className={`mt-1 text-3xl font-semibold tabular-nums tracking-tight ${toneText[m.tone ?? "default"]}`}>
              {m.value}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{m.sub}</p>
            <ArrowUpRight className="absolute right-3 top-3 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Patient flow */}
        {can("eye/flow") && (
          <section className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Patient flow</h2>
                <p className="text-xs text-muted-foreground">Live position of every patient in the clinic</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`${basePath}/eye/flow`}>
                  Open board <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>

            {/* Distribution bar */}
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
              {stageData.map((s, i) =>
                s.list.length > 0 ? (
                  <div
                    key={s.key}
                    className={toneBar[(["default", "info", "default", "success", "warning"] as Tone[])[i % 5]]}
                    style={{ width: `${(s.list.length / active.length) * 100}%` }}
                  />
                ) : null
              )}
            </div>

            <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
              {stageData.map((s, i) => (
                <div key={s.key} className="flex items-center gap-4 px-4 py-3">
                  <span className="w-6 text-xs font-medium tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="w-32 shrink-0 text-sm font-medium">{s.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${s.list.length ? "bg-primary" : ""}`}
                      style={{ width: `${(s.list.length / maxStage) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold tabular-nums">{s.list.length}</span>
                  <span className="hidden w-48 truncate text-xs text-muted-foreground md:block">
                    {s.list.length === 0
                      ? "—"
                      : s.list.slice(0, 3).map((f) => `${f.patients?.first_name ?? ""} ${f.patients?.last_name ?? ""}`.trim()).join(", ")}
                  </span>
                  {s.key === "doctor" && can("eye/visit") && s.list[0] && (
                    <Link
                      to={`${basePath}/eye/visit?patient=${s.list[0].patient_id}`}
                      className="shrink-0 text-xs font-medium text-primary hover:underline"
                    >
                      Open visit
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Right column */}
        <div className="space-y-8">
          {/* Optical lab status */}
          {can("eye/pickup") && (
            <section>
              <h2 className="mb-4 text-base font-semibold tracking-tight">Optical orders</h2>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-semibold tabular-nums">{readyPct}%</span>
                  <span className="text-xs text-muted-foreground">{ready.length} of {pickupTotal} orders ready</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-success" style={{ width: `${readyPct}%` }} />
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-success" />Ready for pickup
                    </span>
                    <span className="font-medium tabular-nums">{ready.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-info" />At the lab
                    </span>
                    <span className="font-medium tabular-nums">{atLab.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-warning" />Patient not notified
                    </span>
                    <span className="font-medium tabular-nums">{notTold.length}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Needs attention */}
          {attention.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-semibold tracking-tight">Needs attention</h2>
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {attention.map((a, i) => (
                  <Link key={i} to={a.to} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${toneBar[a.tone]}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{a.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{a.detail}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Surgeries today */}
          {can("eye/surgery") && todaySurg.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-semibold tracking-tight">Today's surgeries</h2>
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {todaySurg.map((s) => (
                  <Link key={s.id} to={`${basePath}/eye/surgery`} className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-accent/50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{s.procedure_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.patients?.first_name} {s.patients?.last_name}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.status}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
