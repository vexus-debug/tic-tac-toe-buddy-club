interface RegisterOptions {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}

// Register the small retirement worker shipped at /sw.js. It replaces any
// older cache-first worker, clears its cached bundles, and then unregisters
// itself so future app updates always come directly from the network.
export function registerSW(options?: RegisterOptions): (reloadPage?: boolean) => Promise<void> {
  let registration: ServiceWorkerRegistration | null = null;

  void navigator.serviceWorker
    .register("/sw.js", { scope: "/app/", updateViaCache: "none" })
    .then(async (nextRegistration) => {
      registration = nextRegistration;
      await nextRegistration.update();
      options?.onOfflineReady?.();
    })
    .catch(() => undefined);

  return async (reloadPage = false) => {
    await registration?.update();
    if (reloadPage) window.location.reload();
    else options?.onNeedRefresh?.();
  };
}
