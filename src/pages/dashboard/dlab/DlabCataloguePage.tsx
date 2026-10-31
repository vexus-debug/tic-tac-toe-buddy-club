import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLabRecords } from "@/hooks/useLabRecords";
import { CLINICAL_DOMAINS, clinicalDomain } from "@/lib/labCatalog";
import LabRegisterPage from "./LabRegisterPage";
import PriceMatrixEditor from "./billing/PriceMatrixEditor";

const TABS = [
  { value: "services", label: "Restoration Services" },
  { value: "prices", label: "Price Schedules" },
  { value: "addons", label: "Add-ons & Surcharges" },
  { value: "shades", label: "Shades" },
];

/** Restorations grouped by clinical domain with their key spec. */
function DomainOverview() {
  const { data = [] } = useLabRecords("work-types");
  const groups = useMemo(() => {
    const m = new Map<string, any[]>(CLINICAL_DOMAINS.map((d) => [d, []]));
    data.filter((r: any) => r.status === "active").forEach((r: any) => m.get(clinicalDomain(r.data?.category))!.push(r));
    return [...m.entries()].filter(([, l]) => l.length);
  }, [data]);
  if (!groups.length) return null;
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {groups.map(([domain, list]) => (
        <Card key={domain}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              {domain} <Badge variant="secondary">{list.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {list.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{r.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {[r.data?.cdt, r.data?.turnaround_days && `${r.data.turnaround_days}d`, r.data?.multi_unit === "Yes" && "bridge"].filter(Boolean).join(" · ")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DlabCataloguePage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "services";
  return (
    <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })} className="space-y-5">
      <TabsList className="flex h-auto flex-wrap justify-start">
        {TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
      </TabsList>
      <TabsContent value="services" className="space-y-5">
        <DomainOverview />
        <LabRegisterPage kind="work-types" />
      </TabsContent>
      <TabsContent value="prices" className="space-y-8">
        <PriceMatrixEditor />
        <LabRegisterPage kind="price-tiers" />
        <LabRegisterPage kind="client-prices" />
      </TabsContent>
      <TabsContent value="addons"><LabRegisterPage kind="surcharges" /></TabsContent>
      <TabsContent value="shades"><LabRegisterPage kind="shades" /></TabsContent>
    </Tabs>
  );
}
