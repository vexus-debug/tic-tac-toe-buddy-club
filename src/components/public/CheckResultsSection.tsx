import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSearch, Printer, Search } from "lucide-react";

const db = supabase as any;

interface Props {
  clinicName?: string;
  primaryColor: string;
  cardStyle: React.CSSProperties;
  headingStyle: React.CSSProperties;
  mutedStyle: React.CSSProperties;
  bg: string;
}

export default function CheckResultsSection({ clinicName, primaryColor, cardStyle, headingStyle, mutedStyle, bg }: Props) {
  const [serial, setSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lab, setLab] = useState<any>(null);
  const [scan, setScan] = useState<any>(null);

  const lookup = async () => {
    const s = serial.trim();
    if (!s) return;
    setLoading(true);
    setError("");
    setLab(null);
    setScan(null);
    const [{ data: labData }, { data: scanData }] = await Promise.all([
      db.rpc("get_public_result", { _serial: s }),
      db.rpc("get_public_scan", { _serial: s }),
    ]);
    if (labData) setLab(labData);
    else if (scanData) setScan(scanData);
    else setError("No approved report was found for that serial number.");
    setLoading(false);
  };

  const report = lab || scan;

  const printReport = () => {
    const node = document.getElementById("public-result-report");
    if (!node) return;
    const w = window.open("", "_blank", "width=820,height=1000");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${report?.serial || "Report"}</title>
      <style>
        body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#111;padding:32px;line-height:1.5}
        h2{margin:0 0 4px}
        .row{display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:4px 0}
        .box{border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:12px}
        .muted{color:#6b7280;font-size:12px}
      </style></head><body>${node.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <section id="results" className="py-16 px-4 sm:px-6 scroll-mt-16" style={{ backgroundColor: bg }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={headingStyle}>Check your results</h2>
        <p className="mt-2 text-sm" style={mutedStyle}>
          Enter the serial number printed on your receipt to view, download or print your report.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            <Input
              className="pl-9 h-12"
              placeholder="e.g. LAB-2026-00042"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
            />
          </div>
          <Button
            className="h-12 px-7 font-semibold text-white"
            style={{ backgroundColor: primaryColor, borderRadius: 999 }}
            onClick={lookup}
            disabled={loading}
          >
            {loading ? "Checking…" : "Check result"}
          </Button>
        </div>

        {error && (
          <div className="mt-6 p-8 text-center text-sm" style={{ ...cardStyle, ...mutedStyle }}>
            <FileSearch className="mx-auto mb-2 h-6 w-6 opacity-40" />
            {error}
          </div>
        )}

        {report && (
          <div className="mt-6 p-6" style={cardStyle}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <p className="text-xs" style={mutedStyle}>
                Serial <span className="font-mono">{report.serial}</span>
              </p>
              <Button size="sm" variant="outline" onClick={printReport}>
                <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
              </Button>
            </div>

            <div id="public-result-report">
              <h2 style={{ fontWeight: 700 }}>{report.clinic_name || clinicName}</h2>
              <p className="muted text-xs" style={mutedStyle}>
                Serial {report.serial} · {new Date(report.approved_at || report.completed_at || report.reported_at || Date.now()).toLocaleString()}
              </p>

              <div className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
                <p><span style={mutedStyle}>Patient: </span>{lab ? lab.patient_name : scan.patient_name}</p>
                <p><span style={mutedStyle}>Age / Sex: </span>{(lab ? lab.patient_age : scan.age) || "—"} / {(lab ? lab.patient_sex : scan.sex) || "—"}</p>
                {lab && <p><span style={mutedStyle}>Specimen: </span>{lab.specimen || "—"}</p>}
                {lab && <p><span style={mutedStyle}>Referred by: </span>{lab.referring_doctor || "—"}</p>}
                {scan && <p><span style={mutedStyle}>Study: </span>{scan.modality} {scan.body_part || ""}</p>}
              </div>

              {lab && (
                <div className="mt-4 space-y-3">
                  {(lab.results || []).map((r: any, i: number) => (
                    <div key={i} className="box">
                      <p className="font-medium">{r.test_name}</p>
                      <div className="mt-2 text-sm">
                        {Object.entries(r.values || {}).map(([k, v]: any) => (
                          <div key={k} className="row">
                            <span style={mutedStyle}>{k}</span>
                            <span className="font-medium">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                      {r.comment && <p className="muted mt-2 text-xs" style={mutedStyle}>{r.comment}</p>}
                    </div>
                  ))}
                  {(lab.results || []).length === 0 && <p className="text-sm" style={mutedStyle}>No result lines recorded.</p>}
                </div>
              )}

              {scan && (
                <div className="mt-4 space-y-3 text-sm">
                  <div><p className="font-medium">Findings</p><p className="whitespace-pre-wrap" style={mutedStyle}>{scan.findings || "—"}</p></div>
                  <div><p className="font-medium">Impression</p><p className="whitespace-pre-wrap" style={mutedStyle}>{scan.impression || "—"}</p></div>
                  <div><p className="font-medium">Recommendation</p><p className="whitespace-pre-wrap" style={mutedStyle}>{scan.recommendation || "—"}</p></div>
                </div>
              )}

              <p className="muted mt-6 text-center text-xs" style={mutedStyle}>
                This report is issued electronically. Please discuss the result with your doctor.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
