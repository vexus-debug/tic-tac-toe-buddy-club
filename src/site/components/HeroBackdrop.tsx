/** Shared quiet background for site heroes: a faint hairline grid, no glows. */
const HeroBackdrop = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 opacity-[0.04]"
    style={{
      backgroundImage:
        "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
      backgroundSize: "72px 72px",
    }}
  />
);

export default HeroBackdrop;
