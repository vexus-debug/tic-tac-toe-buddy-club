import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Front-end visitor tracker for the public marketing site.
 * Mounted once in App; records pageviews, dwell time, scroll depth,
 * referrer/UTM data and a deep device fingerprint for super-admin analytics.
 * Tracking never breaks the page — every call is fire-and-forget.
 */

const VISITOR_KEY = "clinexus:visitor_id";
const SESSION_KEY = "clinexus:visitor_session";
const FP_KEY = "clinexus:visitor_fp";
const ENDPOINT = "/api/public/track-visitor";
const HEARTBEAT_MS = 30_000;

const TRACKED_SKIP_PREFIXES = ["/app", "/login", "/signup", "/demo"];

interface Fingerprint {
  device_type?: string;
  os?: string;
  browser?: string;
  screen_resolution?: string;
  pixel_ratio?: string;
  gpu_renderer?: string;
  cpu_cores?: number;
  device_memory_gb?: number;
  timezone?: string;
  locale?: string;
  touch_points?: number;
  is_pwa?: boolean;
  fingerprint_hash?: string;
}

const state = {
  sessionId: "",
  visitorId: "",
  fp: null as Fingerprint | null,
  startedAt: 0,
  pageViews: 0,
  landing: "",
  referrer: "",
  utm: {} as Record<string, string | undefined>,
  exitSent: false,
};

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safeGet(store: Storage, key: string): string {
  try {
    return store.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function safeSet(store: Storage, key: string, value: string) {
  try {
    store.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function isTrackedPath(path: string) {
  return !TRACKED_SKIP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`));
}

function collectFingerprint(): Fingerprint {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const fp: Fingerprint = {
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    pixel_ratio: String(window.devicePixelRatio ?? 1),
    cpu_cores: nav.hardwareConcurrency || undefined,
    device_memory_gb: nav.deviceMemory || undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
    locale: navigator.language || undefined,
    touch_points: navigator.maxTouchPoints || 0,
  };

  const ua = navigator.userAgent;
  const isTablet = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const isMobile = /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);
  fp.device_type = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

  if (/Windows/i.test(ua)) fp.os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(ua)) fp.os = "iOS";
  else if (/Mac OS X/i.test(ua)) fp.os = "macOS";
  else if (/Android/i.test(ua)) fp.os = "Android";
  else if (/Linux/i.test(ua)) fp.os = "Linux";

  if (/Edg\//i.test(ua)) fp.browser = "Edge";
  else if (/OPR\//i.test(ua)) fp.browser = "Opera";
  else if (/Chrome\//i.test(ua)) fp.browser = "Chrome";
  else if (/Safari\//i.test(ua)) fp.browser = "Safari";
  else if (/Firefox\//i.test(ua)) fp.browser = "Firefox";

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    if (gl) {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      if (dbg) fp.gpu_renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)).slice(0, 200);
    }
  } catch {
    /* no webgl */
  }

  return fp;
}

function isStandalone() {
  try {
    return window.matchMedia("(display-mode: standalone)").matches;
  } catch {
    return false;
  }
}

function durationSeconds() {
  if (!state.startedAt) return 0;
  return Math.min(Math.floor((Date.now() - state.startedAt) / 1000), 172800);
}

function isBounced() {
  return state.pageViews <= 1 && durationSeconds() < 15;
}

function payload(eventType: string, path: string, metadata?: Record<string, unknown>) {
  return {
    session_id: state.sessionId,
    visitor_id: state.visitorId,
    event_type: eventType,
    path,
    referrer_url: state.referrer || undefined,
    utm: Object.keys(state.utm).length ? state.utm : undefined,
    fingerprint: state.fp ?? undefined,
    duration_seconds: durationSeconds(),
    page_views_count: state.pageViews,
    is_bounced: isBounced(),
    metadata,
  };
}

function send(eventType: string, path: string, metadata?: Record<string, unknown>) {
  try {
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(eventType, path, metadata)),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never break the page */
  }
}

/** Exit events go through sendBeacon so they survive tab close. */
function sendExit(path: string) {
  if (state.exitSent) return;
  state.exitSent = true;
  try {
    const body = JSON.stringify(payload("exit", path));
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    } else {
      send("exit", path);
    }
  } catch {
    /* never break the page */
  }
}

function ensureSession(path: string) {
  if (state.sessionId) return;
  const storedVisitor = safeGet(localStorage, VISITOR_KEY);
  state.visitorId = storedVisitor || makeId();
  if (!storedVisitor) safeSet(localStorage, VISITOR_KEY, state.visitorId);

  const storedSession = safeGet(sessionStorage, SESSION_KEY);
  if (storedSession) {
    state.sessionId = storedSession;
    state.startedAt = Date.now();
    state.pageViews = 1; // continuing session; counts approximate on refresh
  } else {
    state.sessionId = makeId();
    state.startedAt = Date.now();
    state.pageViews = 0;
    safeSet(sessionStorage, SESSION_KEY, state.sessionId);
  }

  state.landing = path;
  state.referrer = document.referrer || "";
  const params = new URLSearchParams(window.location.search);
  state.utm = {
    source: params.get("utm_source") || undefined,
    medium: params.get("utm_medium") || undefined,
    campaign: params.get("utm_campaign") || undefined,
    term: params.get("utm_term") || undefined,
    content: params.get("utm_content") || undefined,
  };

  const cachedFp = safeGet(localStorage, FP_KEY);
  state.fp = collectFingerprint();
  // Hash the fingerprint once per device for a stable cross-session ID.
  const fpRaw = JSON.stringify(state.fp);
  if (cachedFp && crypto?.subtle) {
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(fpRaw)).then((buf) => {
      const hash = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 32);
      state.fp = { ...state.fp, fingerprint_hash: hash };
      if (cachedFp !== hash) safeSet(localStorage, FP_KEY, hash);
    });
  }
}

export function VisitorTracker() {
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  // Pageviews: on mount and on every route change within the public site.
  useEffect(() => {
    const path = location.pathname;
    if (!isTrackedPath(path)) return;
    ensureSession(path);
    state.exitSent = false;
    if (state.pageViews === 0 && !state.landing) state.landing = path;
    state.pageViews += 1;
    send("pageview", path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Heartbeat + exit handling for the lifetime of the tab.
  useEffect(() => {
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (!isTrackedPath(pathRef.current)) return;
      if (!state.sessionId) return;
      send("heartbeat", pathRef.current);
    }, HEARTBEAT_MS);

    const onHidden = () => {
      if (document.visibilityState === "hidden" && state.sessionId && isTrackedPath(pathRef.current)) {
        sendExit(pathRef.current);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") state.exitSent = false;
    };
    const onPageHide = () => {
      if (state.sessionId && isTrackedPath(pathRef.current)) sendExit(pathRef.current);
    };

    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Scroll depth: one event per page at 75% depth.
  useEffect(() => {
    let sent = false;
    const onScroll = () => {
      if (sent || !state.sessionId) return;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable >= 0.75) {
        sent = true;
        send("scroll", pathRef.current, { depth: 75 });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  return null;
}
