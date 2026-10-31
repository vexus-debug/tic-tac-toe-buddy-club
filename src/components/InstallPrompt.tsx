import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isPublicSitePath } from "@/hooks/usePwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "clinexus-install-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const { pathname } = useLocation();
  const isPublic = isPublicSitePath(pathname);

  // Only expose the PWA manifest on dashboard/app pages so browsers never
  // offer installation on the public site.
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (isPublic) link?.remove();
    else if (!link) {
      const el = document.createElement("link");
      el.rel = "manifest";
      el.href = "/manifest.webmanifest";
      document.head.appendChild(el);
    }
  }, [isPublic]);

  useEffect(() => {
    if (isPublic) return;
    if (isStandalone()) return;
    if (window.self !== window.top) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    let timer: number | undefined;
    if (isIos()) {
      timer = window.setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 2500);
    }

    const onInstalled = () => setVisible(false);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, [isPublic]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible || isPublic) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] p-3 sm:left-auto sm:right-4 sm:top-4 sm:w-96 sm:p-0">
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <img
            src="/pwa-icon-192.png"
            alt="Clinexus app icon"
            width={48}
            height={48}
            loading="lazy"
            className="h-12 w-12 rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Install Clinexus</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {iosHint ? (
                <>
                  Tap <Share className="inline h-3 w-3" /> Share, then “Add to Home Screen”.
                </>
              ) : (
                "Add the app to your device for quick, full-screen access."
              )}
            </p>
            {!iosHint && (
              <Button size="sm" className="mt-3" onClick={install}>
                <Download className="mr-1.5 h-4 w-4" />
                Install app
              </Button>
            )}
          </div>
          <button
            aria-label="Dismiss install prompt"
            onClick={dismiss}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
