import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EyeExamsPage from "./EyeExamsPage";
import ContactLensPage from "./ContactLensPage";
import EyeDiagnosticsPage from "./EyeDiagnosticsPage";
import EyeReportsPage from "./EyeReportsPage";
import EyeChartsPage from "./EyeChartsPage";

const TABS = [
  { key: "exams", label: "Eye exams", el: <EyeExamsPage /> },
  { key: "contact-lenses", label: "Contact lenses", el: <ContactLensPage /> },
  { key: "diagnostics", label: "Scans & tests", el: <EyeDiagnosticsPage /> },
  { key: "results", label: "Results", el: <EyeReportsPage /> },
  { key: "charts", label: "Charts", el: <EyeChartsPage /> },
];

/** One place for all eye records, with tabs. */
export default function EyeRecordsPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get("tab")) ? params.get("tab")! : "exams";
  return (
    <Tabs value={tab} onValueChange={(v) => { const p = new URLSearchParams(params); p.set("tab", v); setParams(p, { replace: true }); }}>
      <TabsList className="mb-4 flex h-auto flex-wrap justify-start">
        {TABS.map((t) => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
      </TabsList>
      {TABS.map((t) => <TabsContent key={t.key} value={t.key}>{t.el}</TabsContent>)}
    </Tabs>
  );
}
