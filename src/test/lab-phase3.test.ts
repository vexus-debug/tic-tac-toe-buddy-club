import { describe, it, expect } from "vitest";
import { validateMaterialLot, casesUsingLot, conformityBlockers, conformityHtml, dentistScorecard } from "@/lib/labConformity";

describe("lab phase 3 rules", () => {
  it("a material lot needs a material and a lot number", () => {
    expect(validateMaterialLot({ material: "Zirconia", lot: "ZR-2210A" }, "2026-10-30")).toEqual([]);
    expect(validateMaterialLot({ material: "", lot: "" }, "2026-10-30")).toHaveLength(2);
  });
  it("an expired lot cannot be bound to a case", () => {
    expect(validateMaterialLot({ material: "Zirconia", lot: "ZR1", expiry: "2026-10-29" }, "2026-10-30")).toContain("Material lot is expired");
  });
  it("recall finds every case that used a lot", () => {
    const lots = [{ case_id: "a", data: { lot: "zr1" } }, { case_id: "b", data: { lot: "ZR1" } }, { case_id: "c", data: { lot: "ZR2" } }];
    expect(casesUsingLot(lots, "ZR1")).toEqual(["a", "b"]);
  });
  it("conformity statement needs passed QC, a lot and a dentist", () => {
    expect(conformityBlockers({ qc_status: "passed", lots: [{ material: "Z", lot: "L1" }], doctor: "Dr A" })).toEqual([]);
    expect(conformityBlockers({ qc_status: "rework_needed", lots: [], doctor: "" })).toHaveLength(3);
  });
  it("statement lists the lot numbers and escapes text", () => {
    const html = conformityHtml({ labName: "Lab", case_number: "LC-1", patient: "<b>x</b>", doctor: "Dr A", clinic: "C", teeth: ["11"], work_type: "Crown", lots: [{ material: "Zirconia", lot: "ZR-77" }], releaseDate: "2026-10-30" });
    expect(html).toContain("ZR-77");
    expect(html).not.toContain("<b>x</b>");
  });
  it("dentist scorecard counts only clinic-fault remakes over that dentist's original cases", () => {
    const cases = [
      { id: "1", clinic_doctor_name: "Dr A" }, { id: "2", clinic_doctor_name: "Dr A" },
      { id: "3", clinic_doctor_name: "Dr A" }, { id: "4", clinic_doctor_name: "Dr A" },
      { id: "5", clinic_doctor_name: "Dr A", parent_case_id: "1" },
    ];
    const claims = [{ case_id: "1", data: { fault: "clinic", reason: "Distorted impression" } }, { case_id: "2", data: { fault: "lab" } }];
    const [a] = dentistScorecard(cases, claims);
    expect(a).toMatchObject({ name: "Dr A", cases: 4, clinicRemakes: 1, pct: 25, faults: { "Distorted impression": 1 } });
  });
});
