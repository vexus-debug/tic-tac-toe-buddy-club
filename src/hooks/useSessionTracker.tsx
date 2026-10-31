import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isStandalone } from "@/hooks/usePwa";

const KEY = "clinexus:session_key";

function getSessionKey() {
  try {
    let key = localStorage.getItem(KEY);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(KEY, key);
    }
    return key;
  } catch {
    return "anonymous-device";
  }
}

function detectDevice() {
  const ua = navigator.userAgent;
  const isTablet = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const isMobile = /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);
  const device_type = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

  let os = "Unknown";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Unknown";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";

  return { device_type, os, browser };
}

/** Reports the current device/session to the platform so super admins can see live activity. */
export function useSessionTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const report = async () => {
      if (cancelled || document.visibilityState === "hidden") return;
      const { device_type, os, browser } = detectDevice();
      const orgMatch = pathRef.current.match(/^\/clinic\/([^/]+)/);
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token || cancelled) return;
        await supabase.functions.invoke("track-session", {
          headers: { Authorization: `Bearer ${token}` },
          body: {
            session_key: getSessionKey(),
            device_type,
            os,
            browser,
            is_pwa: isStandalone(),
            current_path: pathRef.current,
            org_slug: orgMatch ? orgMatch[1] : null,
          },
        });
      } catch {
        /* tracking must never break the app */
      }
    };

    void report();
    const interval = window.setInterval(report, 60_000);
    document.addEventListener("visibilitychange", report);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", report);
    };
  }, [user]);
}

export function SessionTracker() {
  useSessionTracker();
  return null;
}
