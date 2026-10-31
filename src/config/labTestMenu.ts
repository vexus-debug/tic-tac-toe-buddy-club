// Fallback printed-menu test list used when the lab_tests table is empty.

export interface MenuTest {
  name: string;
  unit?: string;
  reference_range?: string;
  price?: number;
}

export interface MenuCategory {
  name: string;
  tests: MenuTest[];
}

export const LAB_TEST_MENU: MenuCategory[] = [
  {
    name: "Haematology",
    tests: [
      { name: "Full Blood Count (FBC)", price: 8000 },
      { name: "Packed Cell Volume (PCV)", unit: "%", reference_range: "36-50", price: 1500 },
      { name: "Haemoglobin (Hb)", unit: "g/dL", reference_range: "12-16", price: 2000 },
      { name: "ESR", unit: "mm/hr", reference_range: "0-20", price: 2000 },
      { name: "Blood Group & Genotype", price: 3000 },
      { name: "Clotting Profile (PT/INR/APTT)", price: 12000 },
      { name: "Malaria Parasite (MP)", price: 2000 },
      { name: "Reticulocyte Count", unit: "%", reference_range: "0.5-2.5", price: 3000 },
    ],
  },
  {
    name: "Chemical Pathology",
    tests: [
      { name: "Fasting Blood Sugar", unit: "mg/dL", reference_range: "70-110", price: 1500 },
      { name: "Random Blood Sugar", unit: "mg/dL", reference_range: "70-140", price: 1500 },
      { name: "HbA1c", unit: "%", reference_range: "4.0-5.6", price: 9000 },
      { name: "Liver Function Test (LFT)", price: 12000 },
      { name: "Kidney Function Test (E/U/Cr)", price: 12000 },
      { name: "Lipid Profile", price: 12000 },
      { name: "Serum Electrolytes", price: 9000 },
      { name: "Uric Acid", unit: "mg/dL", reference_range: "2.4-6.0", price: 4000 },
      { name: "Serum Calcium", unit: "mg/dL", reference_range: "8.5-10.5", price: 4000 },
      { name: "Amylase", unit: "U/L", reference_range: "30-110", price: 6000 },
    ],
  },
  {
    name: "Medical Microbiology",
    tests: [
      { name: "Blood Culture & Sensitivity", price: 15000 },
      { name: "Wound Swab M/C/S", price: 8000 },
      { name: "Throat Swab M/C/S", price: 8000 },
      { name: "Stool Culture", price: 8000 },
      { name: "AFB / Sputum Smear", price: 6000 },
    ],
  },
  {
    name: "Urinalysis",
    tests: [
      { name: "Urinalysis (Dipstick)", price: 2000 },
      { name: "Urine Pregnancy Test", price: 1500 },
      { name: "24hr Urine Protein", unit: "mg/24hr", reference_range: "< 150", price: 7000 },
    ],
  },
  {
    name: "Microscopy, Culture & Sensitivity",
    tests: [
      { name: "Urine M/C/S", price: 8000 },
      { name: "High Vaginal Swab M/C/S", price: 8000 },
      { name: "Endocervical Swab M/C/S", price: 8000 },
      { name: "Stool M/C/S", price: 8000 },
    ],
  },
  {
    name: "Semen Analysis",
    tests: [{ name: "Seminal Fluid Analysis", price: 10000 }],
  },
  {
    name: "Serology",
    tests: [
      { name: "Widal Test", price: 3000 },
      { name: "HIV Screening", price: 3000 },
      { name: "Hepatitis B Surface Antigen (HBsAg)", price: 3000 },
      { name: "Hepatitis C Antibody (HCV)", price: 3500 },
      { name: "VDRL", price: 3000 },
      { name: "H. Pylori Antibody", price: 5000 },
      { name: "C-Reactive Protein (CRP)", unit: "mg/L", reference_range: "< 6", price: 6000 },
    ],
  },
  {
    name: "Hormones & Fertility",
    tests: [
      { name: "Female Hormonal Profile (FSH, LH, PRL, E2, Prog)", price: 35000 },
      { name: "Thyroid Function Test (TSH, T3, T4)", price: 22000 },
      { name: "Testosterone", unit: "ng/mL", reference_range: "2.8-8.0", price: 9000 },
      { name: "Prolactin", unit: "ng/mL", reference_range: "4.8-23.3", price: 9000 },
      { name: "Beta HCG", unit: "mIU/mL", price: 9000 },
      { name: "PSA (Total)", unit: "ng/mL", reference_range: "< 4.0", price: 9000 },
    ],
  },
  {
    name: "Viral Load & Molecular",
    tests: [
      { name: "HIV Viral Load", unit: "copies/mL", price: 45000 },
      { name: "Hepatitis B Viral Load", unit: "IU/mL", price: 55000 },
      { name: "CD4 Count", unit: "cells/µL", reference_range: "500-1500", price: 15000 },
    ],
  },
];
