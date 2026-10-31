import { ReactNode, useState } from "react";
import { useAppearance } from "@/hooks/useAppearance";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { HubTabs } from "./HubTabs";
import { AICopilotPanel } from "./AICopilotPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { MobileTabBar } from "./MobileTabBar";
import { ViewAsBanner } from "./ViewAsBanner";
import { DentistVisitTourHost } from "./tour/DentistVisitTourHost";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const { appearance, toggleAppearance } = useAppearance();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className={`dashboard-theme ${appearance === "dark" ? "dark" : ""} flex h-dvh w-full overflow-hidden dashboard-bg`}>
        <DashboardSidebar />
        <DentistVisitTourHost />
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          <ViewAsBanner />
          <DashboardHeader
            onToggleAI={() => setAiOpen(!aiOpen)}
            aiOpen={aiOpen}
            appearance={appearance}
            onToggleAppearance={toggleAppearance}
          />
          <HubTabs />

          {isMobile ? (
            <>
              <AnimatePresence mode="wait">
                {!aiOpen ? (
                  <motion.main
                    key="dashboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 scroll-momentum"
                  >
                    <motion.div initial={false} className="mx-auto w-full max-w-[1540px]">
                      {children}
                    </motion.div>
                  </motion.main>
                ) : (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <AICopilotPanel open={true} onClose={() => setAiOpen(false)} inline />
                  </motion.div>
                )}
              </AnimatePresence>

              <MobileTabBar aiOpen={aiOpen} onOpenAI={() => setAiOpen(true)} onCloseAI={() => setAiOpen(false)} />
            </>
          ) : (
            <>
              <main className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 lg:px-8 lg:py-7 scroll-momentum">
                <motion.div initial={false} className="mx-auto w-full max-w-[1540px]">
                  {children}
                </motion.div>
              </main>
              <AICopilotPanel open={aiOpen} onClose={() => setAiOpen(false)} />
            </>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
