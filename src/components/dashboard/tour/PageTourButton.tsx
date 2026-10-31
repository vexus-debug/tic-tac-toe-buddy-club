import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { GuidedTour } from "./GuidedTour";
import { getTourForPath } from "@/config/tours";

/**
 * Renders a "Walk me through" button when the current clinic page has a
 * step-by-step walk-through defined in @/config/tours.
 */
export function PageTourButton() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const tour = getTourForPath(location.pathname);

  if (!tour) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-tour-launcher
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/15 text-primary px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md group"
        title="Walk me through this page"
      >
        <Compass className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Walk me through</span>
      </button>

      <GuidedTour tour={tour} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
