import { useEffect, useRef } from "react";
import { createScanBuffer } from "@/lib/labScanner";

let ctx: AudioContext | null = null;
/** Short confirmation beep (ok) or low buzz (error). */
export function scanBeep(ok: boolean) {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    const osc = ctx!.createOscillator(), gain = ctx!.createGain();
    osc.type = ok ? "sine" : "square";
    osc.frequency.value = ok ? 1320 : 220;
    gain.gain.value = 0.08;
    osc.connect(gain); gain.connect(ctx!.destination);
    osc.start(); osc.stop(ctx!.currentTime + (ok ? 0.12 : 0.3));
  } catch { /* audio unavailable */ }
}

const isTyping = (el: EventTarget | null) => {
  const n = el as HTMLElement | null;
  if (!n) return false;
  return n.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(n.tagName);
};

/** Listens for barcode scanner bursts anywhere on the page (ignored while typing in a field). */
export function useBarcodeScanner(onScan: (code: string) => void) {
  const cb = useRef(onScan);
  cb.current = onScan;
  useEffect(() => {
    const buf = createScanBuffer();
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) { buf.reset(); return; }
      const code = buf.push(e.key, performance.now());
      if (code) { e.preventDefault(); cb.current(code); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
}
