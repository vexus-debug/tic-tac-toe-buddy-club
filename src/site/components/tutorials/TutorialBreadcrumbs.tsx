import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; to?: string };

const TutorialBreadcrumbs = ({ items }: { items: Crumb[] }) => (
  <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
    {items.map((item, i) => (
      <span key={`${item.label}-${i}`} className="flex items-center gap-2">
        {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" aria-hidden="true" />}
        {item.to ? (
          <Link to={item.to} className="transition-colors hover:text-foreground">
            {item.label}
          </Link>
        ) : (
          <span className="font-medium text-foreground">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
);

export default TutorialBreadcrumbs;
