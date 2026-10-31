import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useOrg } from "@/hooks/useOrg";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, CheckCircle2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PageTour, TourStepDef } from "./types";

interface GuidedTourProps {
  tour: PageTour;
  open: boolean;
  onClose: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const CARD_WIDTH = 320;

function findTarget(step: TourStepDef): HTMLElement | null {
  if (!step.target) return null;
  for (const selector of step.target.split(",")) {
    const trimmed = selector.trim();
    if (!trimmed) continue;
    const el = document.querySelector<HTMLElement>(trimmed);
    if (el && el.offsetParent !== null) return el;
  }
  return null;
}

function measure(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

export function GuidedTour({ tour, open, onClose }: GuidedTourProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { basePath } = useOrg();

  // Keep every step stable — cross-page targets mount after navigation, and
  // steps without a visible target fall back to a centred card.
  const steps = useMemo(() => tour.steps, [tour.steps]);

  const total = steps.length;
  const step = steps[Math.min(index, total - 1)];

  const sync = useCallback(() => {
    if (!step) return;
    const el = findTarget(step);
    setRect(el ? measure(el) : null);
  }, [step]);

  const currentPath = location.pathname.replace(/\/$/, "");
  const pathFor = useCallback(
    (s: TourStepDef): string | null => {
      if (s.path === undefined) return null;
      const prefix = currentPath.startsWith("/app") && !basePath.startsWith("/app") ? "/app" : "";
      const base = `${prefix}${basePath}`;
      return s.path === "" ? `${base}/dashboard` : `${base}/${s.path}`;
    },
    [basePath, currentPath]
  );

  // Keep latest location in refs so navigation only happens when the STEP
  // changes — never because the user moved to another page themselves.
  const locRef = useRef({ path: currentPath, search: location.search });
  locRef.current = { path: currentPath, search: location.search };
  const pathForRef = useRef(pathFor);
  pathForRef.current = pathFor;

  // Step changed (Next / Back) → go to that step's page if we're not on it.
  useEffect(() => {
    if (!open || !step) return;
    const wanted = pathForRef.current(step);
    if (wanted && locRef.current.path !== wanted) {
      // Keep the query string (e.g. ?patientId=) so the selected patient
      // survives cross-page tour steps.
      navigate({ pathname: wanted, search: locRef.current.search });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  // User moved to another page themselves (e.g. clicked "Next: Chart" in the
  // visit bar) → follow them: jump to the matching step instead of dragging
  // them back. Pages the tour doesn't cover (e.g. lab cases) keep the current
  // step open so they can come back and continue.
  useEffect(() => {
    if (!open || !step) return;
    const wanted = pathFor(step);
    if (!wanted || wanted === currentPath) return;
    const ahead = steps.findIndex((s, i) => i > index && pathFor(s) === currentPath);
    const any = ahead >= 0 ? ahead : steps.findIndex((s) => pathFor(s) === currentPath);
    if (any >= 0) setIndex(any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  // Scroll the target into view and track it while it settles. After a
  // navigation the target may mount asynchronously, so keep looking for 3s.
  useEffect(() => {
    if (!open || !step) return;
    const start = performance.now();
    let scrolled = false;
    const tick = () => {
      const el = findTarget(step);
      if (el && !scrolled) {
        scrolled = true;
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
      sync();
      const elapsed = performance.now() - start;
      if (elapsed < 900 || (!el && elapsed < 3000)) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [open, step, sync, currentPath]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [open, sync]);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= total - 1) {
        onClose();
        return i;
      }
      return i + 1;
    });
  }, [total, onClose]);

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack keys while the user is typing or using a dialog on the page.
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goNext, goPrev]);

  if (!open || !step || typeof document === "undefined") return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardWidth = Math.min(CARD_WIDTH, vw - 24);

  // Work out where the tooltip should sit.
  let cardStyle: React.CSSProperties;
  if (!rect || step.placement === "center") {
    cardStyle = {
      width: cardWidth,
      left: (vw - cardWidth) / 2,
      top: Math.max(24, vh / 2 - 140),
    };
  } else {
    const spaceBelow = vh - (rect.top + rect.height);
    const spaceAbove = rect.top;
    const preferTop = step.placement === "top" || (spaceBelow < 220 && spaceAbove > spaceBelow);
    const top = preferTop
      ? Math.max(12, rect.top - 12 - 200)
      : Math.min(vh - 220, rect.top + rect.height + 12);
    const left = Math.min(
      Math.max(12, rect.left + rect.width / 2 - cardWidth / 2),
      vw - cardWidth - 12
    );
    cardStyle = { width: cardWidth, left, top: Math.max(12, top) };
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] pointer-events-none">
      {/* Dimmed backdrop with a cut-out spotlight around the target. It never
          closes the tour and lets clicks pass through, so the user can follow
          "click here" instructions on the real page. Only Skip / X / Esc end it. */}
      <div className="absolute inset-0 pointer-events-none">
        {rect ? (
          <motion.div
            animate={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute rounded-xl ring-2 ring-primary/70 pointer-events-none"
            style={{ boxShadow: "0 0 0 9999px rgba(2,6,23,0.62)" }}
          />
        ) : (
          <div className="absolute inset-0 bg-slate-950/60 pointer-events-none" />
        )}
      </div>

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="absolute rounded-2xl border border-border/70 bg-card shadow-2xl p-4 pointer-events-auto"
          style={cardStyle}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
                <Compass className="h-3.5 w-3.5 text-primary" />
              </span>
              <div className="leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {tour.title} tour
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Step {index + 1} of {total}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 className="mt-3 text-sm font-bold text-foreground">{step.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>

          <div className="mt-3 flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= index ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-muted-foreground"
            >
              Skip
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={index === 0}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </Button>
              <Button size="sm" onClick={goNext} className="gap-1 text-xs">
                {index === total - 1 ? (
                  <>
                    Finish
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
