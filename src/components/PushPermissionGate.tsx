import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { BellRing, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isStandalone } from "@/hooks/usePwa";
import { pushSupported, enablePush, isPushEnabled } from "@/lib/pushClient";
import { useAuth } from "@/hooks/useAuth";
import pwaIcon from "@/assets/clinexus-logo-dashboard.png";

export type PushGateDecision = "pass" | "gate" | "gate-soft";

/** Pure decision logic so it can be unit-tested.
 *  "gate" = must enable notifications before entering the app.
 *  "gate-soft" = permission was explicitly denied: show instructions but let
 *  the user continue so no one is locked out of the clinic app. */
export function pushGateDecision(opts: {
  standalone: boolean;
  supported: boolean;
  permission: string | null; // null = unknown yet
  override: boolean;
}): PushGateDecision {
  if (!opts.supported || !opts.standalone) return "pass";
  if (opts.override) return "pass";
  if (opts.permission === "granted") return "pass";
  if (opts.permission === "default" || opts.permission === null) return "gate";
  return "gate-soft"; // denied
}

/** Installed-app gate: notifications must be enabled before the app opens.
 *  Only applies to the installed PWA (standalone mode); normal browser tabs
 *  keep the gentle EnablePushCard prompt instead. */
export function PushPermissionGate() {
  const { session } = useAuth();
  const [permission, setPermission] = useState<string | null>(null);
  const [override, setOverride] = useState(false);
  const [busy, setBusy] = useState(false);
  const subscribedOnce = useRef(false);

  const supported = pushSupported();
  const standalone = isStandalone();
  const decision = pushGateDecision({ standalone, supported, permission, override });

  // Track permission changes live (e.g. user re-enables in phone settings).
  useEffect(() => {
    if (!supported || !standalone) return;
    setPermission(Notification.permission);
    let status: PermissionStatus | undefined;
    const onChange = () => setPermission(Notification.permission);
    navigator.permissions
      ?.query({ name: "notifications" as PermissionName })
      .then((p) => {
        status = p;
        p.addEventListener("change", onChange);
      })
      .catch(() => undefined);
    return () => status?.removeEventListener("change", onChange);
  }, [supported, standalone]);

  // Once notifications are on and the user is signed in, make sure the push
  // subscription exists too (silent, once per session).
  useEffect(() => {
    if (decision !== "pass" || !session || !supported || !standalone) return;
    if (subscribedOnce.current) return;
    subscribedOnce.current = true;
    (async () => {
      try {
        if (!(await isPushEnabled())) await enablePush();
      } catch {
        /* non-blocking */
      }
    })();
  }, [decision, session, supported, standalone]);

  const enable = async () => {
    setBusy(true);
    try {
      if (session) await enablePush();
      else await Notification.requestPermission();
      setPermission(Notification.permission);
    } finally {
      setBusy(false);
    }
  };

  if (decision === "pass") return <Outlet />;

  const soft = decision === "gate-soft";
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
          {soft ? (
            <Settings className="h-9 w-9 text-muted-foreground" />
          ) : (
            <BellRing className="h-9 w-9 text-primary" />
          )}
        </div>
        <img src={pwaIcon} alt="Clinexus" className="mx-auto mb-4 h-10 w-auto" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {soft ? "Notifications are turned off" : "Turn on notifications to continue"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {soft ? (
            <>
              You chose not to allow notifications, so you may miss important clinic
              alerts. To turn them back on, allow notifications for Clinexus in your
              browser or phone settings, then reopen the app.
            </>
          ) : (
            "Clinexus sends important clinic alerts — new appointments, messages and updates. Allow notifications to open the app."
          )}
        </p>
        {!soft && (
          <Button size="lg" className="mt-6 w-full gap-2" onClick={enable} disabled={busy}>
            <BellRing className="h-4 w-4" />
            {busy ? "Turning on..." : "Allow notifications"}
          </Button>
        )}
        {soft && (
          <Button variant="outline" size="sm" className="mt-6" onClick={() => setOverride(true)}>
            Continue without notifications
          </Button>
        )}
      </div>
    </div>
  );
}
