// Weight-based (mg/kg) dosing for common dental drugs. Advisory only.
export interface DosingDrug { name: string; mgPerKgPerDose: number; maxPerDoseMg: number; frequency: string; dosesPerDay: number; duration: string; days: number; suspensionMgPer5ml: number }

export const DOSING_DRUGS: DosingDrug[] = [
  { name: "Amoxicillin", mgPerKgPerDose: 15, maxPerDoseMg: 500, frequency: "TDS (3x daily)", dosesPerDay: 3, duration: "5 days", days: 5, suspensionMgPer5ml: 250 },
  { name: "Paracetamol", mgPerKgPerDose: 15, maxPerDoseMg: 1000, frequency: "QDS (4x daily)", dosesPerDay: 4, duration: "3 days", days: 3, suspensionMgPer5ml: 120 },
  { name: "Ibuprofen", mgPerKgPerDose: 10, maxPerDoseMg: 400, frequency: "TDS after meals", dosesPerDay: 3, duration: "3 days", days: 3, suspensionMgPer5ml: 100 },
  { name: "Metronidazole", mgPerKgPerDose: 7.5, maxPerDoseMg: 400, frequency: "TDS (3x daily)", dosesPerDay: 3, duration: "5 days", days: 5, suspensionMgPer5ml: 200 },
  { name: "Azithromycin", mgPerKgPerDose: 10, maxPerDoseMg: 500, frequency: "OD (once daily)", dosesPerDay: 1, duration: "3 days", days: 3, suspensionMgPer5ml: 200 },
  { name: "Clindamycin", mgPerKgPerDose: 7, maxPerDoseMg: 300, frequency: "TDS (3x daily)", dosesPerDay: 3, duration: "5 days", days: 5, suspensionMgPer5ml: 75 },
];

export function calcDose(drug: DosingDrug, weightKg: number) {
  const doseMg = Math.round(Math.min(drug.mgPerKgPerDose * weightKg, drug.maxPerDoseMg));
  const doseMl = Math.round((doseMg / drug.suspensionMgPer5ml) * 5 * 10) / 10;
  const totalMl = Math.ceil(doseMl * drug.dosesPerDay * drug.days);
  return { doseMg, doseMl, totalMl, capped: drug.mgPerKgPerDose * weightKg > drug.maxPerDoseMg };
}
