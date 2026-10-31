// Per-test result field templates: analyte, unit and reference range.
// Ranges use { low, high } for numeric flagging; text fields have no range.

export interface TemplateField {
  key: string;
  label: string;
  unit?: string;
  range?: string;
  low?: number;
  high?: number;
  type?: "number" | "text" | "select";
  options?: string[];
}

export const TEST_TEMPLATES: Record<string, TemplateField[]> = {
  "full blood count (fbc)": [
    { key: "wbc", label: "White Blood Cells", unit: "x10⁹/L", range: "4.0 - 11.0", low: 4, high: 11 },
    { key: "rbc", label: "Red Blood Cells", unit: "x10¹²/L", range: "4.2 - 5.9", low: 4.2, high: 5.9 },
    { key: "hb", label: "Haemoglobin", unit: "g/dL", range: "12 - 16", low: 12, high: 16 },
    { key: "pcv", label: "Packed Cell Volume", unit: "%", range: "36 - 50", low: 36, high: 50 },
    { key: "mcv", label: "MCV", unit: "fL", range: "80 - 100", low: 80, high: 100 },
    { key: "mch", label: "MCH", unit: "pg", range: "27 - 33", low: 27, high: 33 },
    { key: "mchc", label: "MCHC", unit: "g/dL", range: "32 - 36", low: 32, high: 36 },
    { key: "platelets", label: "Platelets", unit: "x10⁹/L", range: "150 - 450", low: 150, high: 450 },
    { key: "neutrophils", label: "Neutrophils", unit: "%", range: "40 - 75", low: 40, high: 75 },
    { key: "lymphocytes", label: "Lymphocytes", unit: "%", range: "20 - 45", low: 20, high: 45 },
    { key: "monocytes", label: "Monocytes", unit: "%", range: "2 - 10", low: 2, high: 10 },
    { key: "eosinophils", label: "Eosinophils", unit: "%", range: "1 - 6", low: 1, high: 6 },
    { key: "basophils", label: "Basophils", unit: "%", range: "0 - 1", low: 0, high: 1 },
  ],
  "packed cell volume (pcv)": [
    { key: "pcv", label: "PCV", unit: "%", range: "36 - 50", low: 36, high: 50 },
  ],
  "haemoglobin (hb)": [{ key: "hb", label: "Haemoglobin", unit: "g/dL", range: "12 - 16", low: 12, high: 16 }],
  esr: [{ key: "esr", label: "ESR", unit: "mm/hr", range: "0 - 20", low: 0, high: 20 }],
  "blood group & genotype": [
    { key: "group", label: "Blood Group", type: "select", options: ["A", "B", "AB", "O"] },
    { key: "rhesus", label: "Rhesus", type: "select", options: ["Positive", "Negative"] },
    { key: "genotype", label: "Genotype", type: "select", options: ["AA", "AS", "AC", "SS", "SC"] },
  ],
  "clotting profile (pt/inr/aptt)": [
    { key: "pt", label: "Prothrombin Time", unit: "sec", range: "11 - 13.5", low: 11, high: 13.5 },
    { key: "inr", label: "INR", range: "0.8 - 1.2", low: 0.8, high: 1.2 },
    { key: "aptt", label: "APTT", unit: "sec", range: "25 - 35", low: 25, high: 35 },
  ],
  "malaria parasite (mp)": [
    { key: "result", label: "Malaria Parasite", type: "select", options: ["Not seen", "Seen (+)", "Seen (++)", "Seen (+++)"] },
    { key: "density", label: "Parasite Density", unit: "/µL", type: "text" },
  ],
  "reticulocyte count": [{ key: "retic", label: "Reticulocytes", unit: "%", range: "0.5 - 2.5", low: 0.5, high: 2.5 }],

  "fasting blood sugar": [{ key: "fbs", label: "Fasting Blood Sugar", unit: "mg/dL", range: "70 - 110", low: 70, high: 110 }],
  "random blood sugar": [{ key: "rbs", label: "Random Blood Sugar", unit: "mg/dL", range: "70 - 140", low: 70, high: 140 }],
  hba1c: [{ key: "hba1c", label: "HbA1c", unit: "%", range: "4.0 - 5.6", low: 4, high: 5.6 }],
  "liver function test (lft)": [
    { key: "tb", label: "Total Bilirubin", unit: "mg/dL", range: "0.2 - 1.2", low: 0.2, high: 1.2 },
    { key: "db", label: "Direct Bilirubin", unit: "mg/dL", range: "0.0 - 0.3", low: 0, high: 0.3 },
    { key: "ast", label: "AST (SGOT)", unit: "U/L", range: "0 - 40", low: 0, high: 40 },
    { key: "alt", label: "ALT (SGPT)", unit: "U/L", range: "0 - 41", low: 0, high: 41 },
    { key: "alp", label: "Alkaline Phosphatase", unit: "U/L", range: "40 - 129", low: 40, high: 129 },
    { key: "tp", label: "Total Protein", unit: "g/dL", range: "6.4 - 8.3", low: 6.4, high: 8.3 },
    { key: "alb", label: "Albumin", unit: "g/dL", range: "3.5 - 5.2", low: 3.5, high: 5.2 },
  ],
  "kidney function test (e/u/cr)": [
    { key: "urea", label: "Urea", unit: "mg/dL", range: "15 - 45", low: 15, high: 45 },
    { key: "creatinine", label: "Creatinine", unit: "mg/dL", range: "0.6 - 1.3", low: 0.6, high: 1.3 },
    { key: "na", label: "Sodium", unit: "mmol/L", range: "135 - 145", low: 135, high: 145 },
    { key: "k", label: "Potassium", unit: "mmol/L", range: "3.5 - 5.1", low: 3.5, high: 5.1 },
    { key: "cl", label: "Chloride", unit: "mmol/L", range: "98 - 107", low: 98, high: 107 },
    { key: "hco3", label: "Bicarbonate", unit: "mmol/L", range: "22 - 29", low: 22, high: 29 },
  ],
  "serum electrolytes": [
    { key: "na", label: "Sodium", unit: "mmol/L", range: "135 - 145", low: 135, high: 145 },
    { key: "k", label: "Potassium", unit: "mmol/L", range: "3.5 - 5.1", low: 3.5, high: 5.1 },
    { key: "cl", label: "Chloride", unit: "mmol/L", range: "98 - 107", low: 98, high: 107 },
    { key: "hco3", label: "Bicarbonate", unit: "mmol/L", range: "22 - 29", low: 22, high: 29 },
  ],
  "lipid profile": [
    { key: "tc", label: "Total Cholesterol", unit: "mg/dL", range: "< 200", low: 0, high: 200 },
    { key: "tg", label: "Triglycerides", unit: "mg/dL", range: "< 150", low: 0, high: 150 },
    { key: "hdl", label: "HDL Cholesterol", unit: "mg/dL", range: "> 40", low: 40, high: 100 },
    { key: "ldl", label: "LDL Cholesterol", unit: "mg/dL", range: "< 130", low: 0, high: 130 },
  ],
  "uric acid": [{ key: "uric", label: "Uric Acid", unit: "mg/dL", range: "2.4 - 6.0", low: 2.4, high: 6 }],
  "serum calcium": [{ key: "ca", label: "Calcium", unit: "mg/dL", range: "8.5 - 10.5", low: 8.5, high: 10.5 }],
  amylase: [{ key: "amylase", label: "Amylase", unit: "U/L", range: "30 - 110", low: 30, high: 110 }],

  "blood culture & sensitivity": [
    { key: "organism", label: "Organism Isolated", type: "text" },
    { key: "sensitive", label: "Sensitive To", type: "text" },
    { key: "resistant", label: "Resistant To", type: "text" },
  ],
  "wound swab m/c/s": [
    { key: "organism", label: "Organism Isolated", type: "text" },
    { key: "sensitive", label: "Sensitive To", type: "text" },
    { key: "resistant", label: "Resistant To", type: "text" },
  ],
  "throat swab m/c/s": [
    { key: "organism", label: "Organism Isolated", type: "text" },
    { key: "sensitive", label: "Sensitive To", type: "text" },
  ],
  "stool culture": [
    { key: "organism", label: "Organism Isolated", type: "text" },
    { key: "sensitive", label: "Sensitive To", type: "text" },
  ],
  "afb / sputum smear": [
    { key: "afb", label: "AFB", type: "select", options: ["Not seen", "Scanty", "1+", "2+", "3+"] },
  ],

  "urinalysis (dipstick)": [
    { key: "colour", label: "Colour", type: "text" },
    { key: "appearance", label: "Appearance", type: "text" },
    { key: "ph", label: "pH", range: "4.5 - 8.0", low: 4.5, high: 8 },
    { key: "sg", label: "Specific Gravity", range: "1.005 - 1.030", low: 1.005, high: 1.03 },
    { key: "protein", label: "Protein", type: "select", options: ["Nil", "Trace", "+", "++", "+++"] },
    { key: "glucose", label: "Glucose", type: "select", options: ["Nil", "Trace", "+", "++", "+++"] },
    { key: "ketones", label: "Ketones", type: "select", options: ["Nil", "Trace", "+", "++"] },
    { key: "blood", label: "Blood", type: "select", options: ["Nil", "Trace", "+", "++"] },
    { key: "nitrite", label: "Nitrite", type: "select", options: ["Negative", "Positive"] },
    { key: "leucocytes", label: "Leucocytes", type: "select", options: ["Nil", "Trace", "+", "++"] },
  ],
  "urine pregnancy test": [
    { key: "result", label: "Result", type: "select", options: ["Negative", "Positive"] },
  ],
  "24hr urine protein": [{ key: "protein", label: "24hr Urine Protein", unit: "mg/24hr", range: "< 150", low: 0, high: 150 }],

  "urine m/c/s": [
    { key: "pus_cells", label: "Pus Cells", unit: "/hpf", type: "text" },
    { key: "epithelial", label: "Epithelial Cells", unit: "/hpf", type: "text" },
    { key: "rbc", label: "Red Cells", unit: "/hpf", type: "text" },
    { key: "casts", label: "Casts", type: "text" },
    { key: "crystals", label: "Crystals", type: "text" },
    { key: "organism", label: "Organism Isolated", type: "text" },
    { key: "colony", label: "Colony Count", unit: "cfu/mL", type: "text" },
    { key: "sensitive", label: "Sensitive To", type: "text" },
    { key: "resistant", label: "Resistant To", type: "text" },
  ],
  "high vaginal swab m/c/s": [
    { key: "pus_cells", label: "Pus Cells", unit: "/hpf", type: "text" },
    { key: "epithelial", label: "Epithelial Cells", unit: "/hpf", type: "text" },
    { key: "trichomonas", label: "Trichomonas vaginalis", type: "select", options: ["Not seen", "Seen"] },
    { key: "candida", label: "Candida species", type: "select", options: ["Not seen", "Seen"] },
    { key: "organism", label: "Organism Isolated", type: "text" },
    { key: "sensitive", label: "Sensitive To", type: "text" },
    { key: "resistant", label: "Resistant To", type: "text" },
  ],
  "endocervical swab m/c/s": [
    { key: "organism", label: "Organism Isolated", type: "text" },
    { key: "sensitive", label: "Sensitive To", type: "text" },
    { key: "resistant", label: "Resistant To", type: "text" },
  ],
  "stool m/c/s": [
    { key: "appearance", label: "Appearance", type: "text" },
    { key: "ova", label: "Ova / Parasites", type: "text" },
    { key: "cysts", label: "Cysts", type: "text" },
    { key: "organism", label: "Organism Isolated", type: "text" },
    { key: "sensitive", label: "Sensitive To", type: "text" },
  ],

  "seminal fluid analysis": [
    { key: "abstinence", label: "Days of Abstinence", type: "text" },
    { key: "volume", label: "Volume", unit: "mL", range: "≥ 1.5", low: 1.5, high: 8 },
    { key: "appearance", label: "Appearance", type: "text" },
    { key: "liquefaction", label: "Liquefaction Time", unit: "min", range: "< 60", low: 0, high: 60 },
    { key: "ph", label: "pH", range: "7.2 - 8.0", low: 7.2, high: 8 },
    { key: "count", label: "Sperm Concentration", unit: "x10⁶/mL", range: "≥ 15", low: 15, high: 250 },
    { key: "motility", label: "Total Motility", unit: "%", range: "≥ 40", low: 40, high: 100 },
    { key: "progressive", label: "Progressive Motility", unit: "%", range: "≥ 32", low: 32, high: 100 },
    { key: "morphology", label: "Normal Morphology", unit: "%", range: "≥ 4", low: 4, high: 100 },
    { key: "pus_cells", label: "Pus Cells", unit: "/hpf", type: "text" },
  ],

  "widal test": [
    { key: "so", label: "S. typhi O", type: "text" },
    { key: "sh", label: "S. typhi H", type: "text" },
    { key: "pao", label: "S. paratyphi A (O)", type: "text" },
    { key: "pah", label: "S. paratyphi A (H)", type: "text" },
    { key: "pbo", label: "S. paratyphi B (O)", type: "text" },
    { key: "pbh", label: "S. paratyphi B (H)", type: "text" },
  ],
  "hiv screening": [{ key: "result", label: "HIV 1 & 2 Antibody", type: "select", options: ["Non-reactive", "Reactive"] }],
  "hepatitis b surface antigen (hbsag)": [
    { key: "result", label: "HBsAg", type: "select", options: ["Non-reactive", "Reactive"] },
  ],
  "hepatitis c antibody (hcv)": [
    { key: "result", label: "Anti-HCV", type: "select", options: ["Non-reactive", "Reactive"] },
  ],
  vdrl: [{ key: "result", label: "VDRL", type: "select", options: ["Non-reactive", "Reactive"] }],
  "h. pylori antibody": [
    { key: "result", label: "H. pylori Antibody", type: "select", options: ["Negative", "Positive"] },
  ],
  "c-reactive protein (crp)": [{ key: "crp", label: "CRP", unit: "mg/L", range: "< 6", low: 0, high: 6 }],

  "female hormonal profile (fsh, lh, prl, e2, prog)": [
    { key: "fsh", label: "FSH", unit: "mIU/mL", range: "3.5 - 12.5 (follicular)", low: 3.5, high: 12.5 },
    { key: "lh", label: "LH", unit: "mIU/mL", range: "2.4 - 12.6 (follicular)", low: 2.4, high: 12.6 },
    { key: "prl", label: "Prolactin", unit: "ng/mL", range: "4.8 - 23.3", low: 4.8, high: 23.3 },
    { key: "e2", label: "Oestradiol", unit: "pg/mL", range: "27 - 122", low: 27, high: 122 },
    { key: "prog", label: "Progesterone", unit: "ng/mL", range: "0.1 - 25", low: 0.1, high: 25 },
  ],
  "thyroid function test (tsh, t3, t4)": [
    { key: "tsh", label: "TSH", unit: "µIU/mL", range: "0.4 - 4.0", low: 0.4, high: 4 },
    { key: "t3", label: "Total T3", unit: "ng/dL", range: "80 - 200", low: 80, high: 200 },
    { key: "t4", label: "Total T4", unit: "µg/dL", range: "5.1 - 14.1", low: 5.1, high: 14.1 },
  ],
  testosterone: [{ key: "testosterone", label: "Testosterone", unit: "ng/mL", range: "2.8 - 8.0", low: 2.8, high: 8 }],
  prolactin: [{ key: "prl", label: "Prolactin", unit: "ng/mL", range: "4.8 - 23.3", low: 4.8, high: 23.3 }],
  "beta hcg": [{ key: "hcg", label: "Beta HCG", unit: "mIU/mL", range: "< 5 (non-pregnant)", low: 0, high: 5 }],
  "psa (total)": [{ key: "psa", label: "Total PSA", unit: "ng/mL", range: "< 4.0", low: 0, high: 4 }],

  "hiv viral load": [
    { key: "vl", label: "HIV-1 RNA", unit: "copies/mL", range: "Not detected", type: "text" },
    { key: "log", label: "Log10", type: "text" },
  ],
  "hepatitis b viral load": [
    { key: "vl", label: "HBV DNA", unit: "IU/mL", range: "Not detected", type: "text" },
    { key: "log", label: "Log10", type: "text" },
  ],
  "cd4 count": [{ key: "cd4", label: "CD4 Absolute Count", unit: "cells/µL", range: "500 - 1500", low: 500, high: 1500 }],
};

export function getTemplate(testName: string): TemplateField[] {
  const key = testName.trim().toLowerCase();
  if (TEST_TEMPLATES[key]) return TEST_TEMPLATES[key];
  const partial = Object.keys(TEST_TEMPLATES).find((k) => key.includes(k) || k.includes(key));
  if (partial) return TEST_TEMPLATES[partial];
  return [{ key: "result", label: "Result", type: "text" }, { key: "unit", label: "Unit", type: "text" }];
}

export function isOutOfRange(field: TemplateField, value: any): boolean {
  if (value === "" || value === undefined || value === null) return false;
  if (field.low === undefined && field.high === undefined) return false;
  const n = Number(value);
  if (Number.isNaN(n)) return false;
  if (field.low !== undefined && n < field.low) return true;
  if (field.high !== undefined && n > field.high) return true;
  return false;
}
