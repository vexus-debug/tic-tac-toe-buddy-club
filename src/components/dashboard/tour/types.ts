export interface TourStepDef {
  /**
   * CSS selector for the element to highlight. Multiple selectors can be
   * separated by commas — the first match found in the DOM is used.
   * Steps whose target is not present on screen are skipped automatically.
   */
  target?: string;
  /**
   * Route path after /clinic/:slug/ (e.g. "dental-charts"). When set, the
   * tour navigates to that real page before highlighting the target, so the
   * walk-through shows the actual screens the user works on.
   */
  path?: string;
  title: string;
  body: string;
  /** Preferred tooltip placement relative to the target. */
  placement?: "top" | "bottom" | "left" | "right" | "center";
}

export interface PageTour {
  /** Short name of the page, shown in the tour header. */
  title: string;
  steps: TourStepDef[];
}

/** Map of route key (path after /clinic/:slug/) to its walk-through. */
export type TourMap = Record<string, PageTour>;
