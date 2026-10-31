import { Link } from "react-router-dom";
import type { ClinicTutorialType } from "@/site/data/tutorials";

type TutorialSidebarProps = {
  clinic: ClinicTutorialType;
  activeSection?: string;
  activeTutorial?: string;
};

const TutorialSidebar = ({ clinic, activeSection, activeTutorial }: TutorialSidebarProps) => (
  <aside className="lg:sticky lg:top-24 lg:self-start">
    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {clinic.name}
    </p>
    <nav className="mt-4 space-y-5 border-l border-border/70 pl-4">
      {clinic.sections.map((section) => {
        const isActiveSection = section.slug === activeSection;
        return (
          <div key={section.slug}>
            <Link
              to={`/tutorials/${clinic.slug}/${section.slug}`}
              className={`block text-sm transition-colors ${
                isActiveSection ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {section.title}
            </Link>
            {isActiveSection && section.tutorials.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {section.tutorials.map((tutorial) => (
                  <li key={tutorial.slug}>
                    <Link
                      to={`/tutorials/${clinic.slug}/${section.slug}/${tutorial.slug}`}
                      className={`block text-[0.8rem] leading-snug transition-colors ${
                        tutorial.slug === activeTutorial
                          ? "font-medium text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tutorial.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  </aside>
);

export default TutorialSidebar;
