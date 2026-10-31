import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useResultsSearch } from "@/hooks/lab/useLab";
import { useOrg } from "@/hooks/useOrg";
import { Search, FileSearch } from "lucide-react";

export default function ResultsSearchPage() {
  const { basePath } = useOrg();
  const [term, setTerm] = useState("");
  const { data: results = [], isFetching } = useResultsSearch(term);

  return (
    <div className="space-y-6">
      <PageHeader title="Results Search" description="Find results by serial, patient name or test name" />

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Type at least 2 characters…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      {term.trim().length <= 1 && (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileSearch className="mx-auto mb-2 h-6 w-6 opacity-40" />
            Start typing to search completed and in-progress results.
          </CardContent>
        </Card>
      )}

      {term.trim().length > 1 && (
        <div className="space-y-3">
          {isFetching && <p className="text-sm text-muted-foreground">Searching…</p>}
          {!isFetching && results.length === 0 && (
            <Card className="glass-card">
              <CardContent className="py-12 text-center text-muted-foreground">No matching results.</CardContent>
            </Card>
          )}
          {results.map((f: any) => (
            <Card key={f.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {f.patient_name}{" "}
                      <span className="font-mono text-xs text-muted-foreground">{f.serial}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(f.created_at).toLocaleString()} · {f.specimen || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{f.status}</Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`${basePath}/diagnostics/forms/${f.serial}`}>Open</Link>
                    </Button>
                  </div>
                </div>
                {!!f.results?.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {f.results.map((r: any, i: number) => (
                      <span key={i} className="rounded-md bg-muted/40 px-2 py-1 text-xs">
                        {r.test_name}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
