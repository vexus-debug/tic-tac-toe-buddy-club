import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigationType } from "react-router-dom";

interface AdminLayoutProps {
  children: ReactNode;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 350,
  damping: 30,
  mass: 0.8,
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navType = useNavigationType();
  const isBack = navType === "POP";

  const pageVariants = {
    initial: { opacity: 0, x: isBack ? -40 : 40, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: isBack ? 40 : -40, scale: 0.98 },
  };

  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full overflow-hidden dashboard-bg">
        <AdminSidebar />
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto overscroll-contain p-4 lg:p-6 scroll-momentum">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springTransition}
                className="gpu-accelerated mx-auto w-full max-w-[1540px]"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
