interface SectionHeadingProps {
  badge?: string;
  title: string;
  description?: string;
  center?: boolean;
}

const SectionHeading = ({ badge, title, description, center = true }: SectionHeadingProps) => {
  return (
    <div className={`mb-12 max-w-2xl space-y-4 ${center ? "mx-auto text-center" : ""}`}>
      {badge && (
        <span className="inline-block rounded-sm border border-border bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
          {badge}
        </span>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h2>
      {description && <p className="text-lg text-muted-foreground">{description}</p>}
    </div>
  );
};

export default SectionHeading;
