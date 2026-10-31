import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const COOKIE_KEY = "clinexus-cookie-choice";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(COOKIE_KEY) === null);
  }, []);

  const choose = (choice: "all" | "essential") => {
    window.localStorage.setItem(COOKIE_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[90] rounded-md border border-border bg-card p-4 sm:inset-x-auto sm:left-6 sm:max-w-xl">
      <p className="text-sm font-semibold text-foreground">Your cookie choices</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Clinexus uses essential cookies to keep the site working. Optional analytics cookies help us improve the experience.
        Read the <Link to="/cookies" className="font-medium text-primary underline-offset-2 hover:underline">Cookie Policy</Link> before choosing.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => choose("all")}>Accept all</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => choose("essential")}>Essential only</Button>
      </div>
    </aside>
  );
}