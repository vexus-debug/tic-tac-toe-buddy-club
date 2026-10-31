import { ReactNode } from "react";
import { motion } from "framer-motion";
import { PageTutorial, PageTutorialProps } from "@/components/dashboard/PageTutorial";
import { PageTourButton } from "@/components/dashboard/tour/PageTourButton";


interface PageHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
  badge?: ReactNode;
  tutorial?: PageTutorialProps;
}

export function PageHeader({ title, description, children, badge, tutorial }: PageHeaderProps) {
  return (
    <motion.div
      data-tour="page-header"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <div className="flex items-center gap-2.5">

          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {badge}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2" data-tour="page-actions">
        <PageTourButton />
        {tutorial && <PageTutorial {...tutorial} />}
        {children}
      </div>

    </motion.div>
  );
}
