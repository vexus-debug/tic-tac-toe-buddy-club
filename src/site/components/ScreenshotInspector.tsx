import { useEffect, useState } from "react";
import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScreenshotInspectorProps = {
  src: string;
  alt: string;
};

export default function ScreenshotInspector({ src, alt }: ScreenshotInspectorProps) {
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreen]);

  const controls = (
    <div className="flex items-center gap-1 rounded-md border border-border/70 bg-card p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setZoom((value) => Math.max(1, value - 0.25))}
        disabled={zoom <= 1}
        aria-label="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="min-w-12 text-center text-xs font-medium text-muted-foreground" aria-live="polite">
        {Math.round(zoom * 100)}%
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setZoom((value) => Math.min(2.5, value + 0.25))}
        disabled={zoom >= 2.5}
        aria-label="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <span className="mx-1 h-5 w-px bg-border" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setZoom(1)}
        disabled={zoom === 1}
        aria-label="Reset zoom"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setFullscreen(true)}
        aria-label="View screenshot fullscreen"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <>
      <figure className="overflow-hidden rounded-md border border-border/70 bg-muted/20">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-card px-3 py-2">
          <figcaption className="text-xs font-medium text-muted-foreground">Dashboard screenshot</figcaption>
          {controls}
        </div>
        <div className="max-h-[34rem] overflow-auto bg-muted/30 p-3 sm:p-5">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="mx-auto block origin-top-left transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, marginBottom: `${(zoom - 1) * 100}%` }}
          />
        </div>
      </figure>

      {fullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/80 p-4 sm:p-8">
          <div className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-md border border-border/70 bg-background">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-3 py-2 sm:px-5">
              <p className="text-sm font-medium text-foreground">{alt}</p>
              <div className="flex items-center gap-2">
                {controls}
                <Button type="button" variant="ghost" size="icon" onClick={() => setFullscreen(false)} aria-label="Close fullscreen screenshot">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="overflow-auto bg-muted/30 p-4 sm:p-8">
              <img
                src={src}
                alt={alt}
                className="mx-auto block origin-top-left transition-transform duration-200"
                style={{ transform: `scale(${zoom})`, marginBottom: `${(zoom - 1) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}