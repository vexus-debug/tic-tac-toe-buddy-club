import { ReactNode } from "react";
import Navbar from "./Navbar";
import AnnouncementTicker from "./AnnouncementTicker";
import Footer from "./Footer";
import CookieConsent from "./CookieConsent";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="site-theme flex min-h-screen flex-col pt-[100px]">
      <AnnouncementTicker />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieConsent />
      <FloatingWhatsAppButton />
    </div>
  );
};

export default Layout;
