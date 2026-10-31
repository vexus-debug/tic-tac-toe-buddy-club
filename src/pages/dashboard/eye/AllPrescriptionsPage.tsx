import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpticalPrescriptionsPage from "./OpticalPrescriptionsPage";
import PrescriptionsPage from "../PrescriptionsPage";

/** Glasses and medicine prescriptions under one menu item. */
export default function AllPrescriptionsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "medicines" ? "medicines" : "glasses";
  return (
    <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
      <TabsList className="mb-4">
        <TabsTrigger value="glasses">Glasses</TabsTrigger>
        <TabsTrigger value="medicines">Medicines & drops</TabsTrigger>
      </TabsList>
      <TabsContent value="glasses"><OpticalPrescriptionsPage /></TabsContent>
      <TabsContent value="medicines"><PrescriptionsPage /></TabsContent>
    </Tabs>
  );
}
