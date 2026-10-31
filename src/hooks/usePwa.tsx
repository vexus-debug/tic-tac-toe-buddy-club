import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const SW_URL = "/sw.js";

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/** The PWA (service worker, manifest, install UI) is only offered on the
 *  app area: everything under /app (login, signup, clinic and admin
 *  dashboards). This matches the manifest scope, so public site links
 *  always open in the normal browser, not the installed app. */
export function isAppInstallPath(pathname = window.location.pathname) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

export function isPublicSitePath(pathname = window.location.pathname) {
  return !isAppInstallPath(pathname);
}

/** Contexts where a service worker must never be registered. */
function swAllowed() {
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false;
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return false;
  if (h === "lovableproject.com" || h.endsWith(".lovableproject.com")) return false;
  if (h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com")) return false;
  if (h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")) return false;
  if (new URLSearchParams(window.location.search).has("sw") && new URLSearchParams(window.location.search).get("sw") === "off") return false;
  if (isPublicSitePath()) return false;
  return true;
}

async function unregisterAppSw() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  const removed = await Promise.all(
    regs
      .filter((r) => {
        const scriptUrl = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL;
        if (!scriptUrl) return false;
        try {
          return new URL(scriptUrl).origin === window.location.origin && new URL(scriptUrl).pathname === SW_URL;
        } catch {
          return false;
        }
      })
      .map((r) => r.unregister().catch(() => false)),
  );
  const hadSw = removed.some(Boolean);
  if (!hadSw) return;

  // A stale service worker was controlling this page: purge its caches so
  // future requests go straight to the network. Never force a reload here —
  // it can fire while the user is in the middle of something (e.g. the
  // mobile file picker) and would lose their place.
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.allSettled(keys.filter((k) => k.startsWith("clinexus-") || k.startsWith("workbox-")).map((k) => caches.delete(k)));
  }
}

interface PwaContextValue {
  canInstall: boolean;
  installed: boolean;
  iosInstallHint: boolean;
  offlineReady: boolean;
  needRefresh: boolean;
  swEnabled: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  applyUpdate: () => void;
  dismissUpdate: () => void;
}

const PwaContext = createContext<PwaContextValue | null>(null);

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [swEnabled, setSwEnabled] = useState(false);
  const updateRef = useRef<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!swAllowed()) {
        await unregisterAppSw();
        return;
      }
      const { registerSW } = await import("@/lib/pwa-register-stub");
      if (cancelled) return;
      setSwEnabled(true);
      updateRef.current = registerSW({
        immediate: true,
        onNeedRefresh: () => setNeedRefresh(true),
        onOfflineReady: () => setOfflineReady(true),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome;
  }, [deferred]);

  const applyUpdate = useCallback(() => {
    setNeedRefresh(false);
    if (updateRef.current) void updateRef.current(true);
  }, []);

  return (
    <PwaContext.Provider
      value={{
        canInstall: !!deferred,
        installed,
        iosInstallHint: !installed && isIos() && !deferred,
        offlineReady,
        needRefresh,
        swEnabled,
        promptInstall,
        applyUpdate,
        dismissUpdate: () => setNeedRefresh(false),
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error("usePwa must be used within PwaProvider");
  return ctx;
}
