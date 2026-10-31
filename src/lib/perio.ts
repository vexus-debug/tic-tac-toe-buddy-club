// Periodontal charting helpers (6-point probing).

export const SITES = ["DB", "B", "MB", "DL", "L", "ML"] as const;
export type Site = (typeof SITES)[number];

export interface PerioTooth {
  pd: (number | null)[]; // 6 probing depths, SITES order
  rec: (number | null)[]; // 6 recession values (mm, may be negative for hyperplasia)
  bop: boolean[];
  sup: boolean[];
  mobility?: 0 | 1 | 2 | 3;
  furcation?: 0 | 1 | 2 | 3 | 4;
}

export type PerioTeeth = Record<string, PerioTooth>;

export const emptyTooth = (): PerioTooth => ({
  pd: Array(6).fill(null),
  rec: Array(6).fill(null),
  bop: Array(6).fill(false),
  sup: Array(6).fill(false),
  mobility: 0,
  furcation: 0,
});

/** CAL = PD + recession. Null when PD missing. */
export function cal(pd: number | null, rec: number | null): number | null {
  if (pd == null) return null;
  return pd + (rec ?? 0);
}

/** % of probed sites that bled. Returns 0 when nothing probed. */
export function bopPercent(teeth: PerioTeeth): number {
  let probed = 0;
  let bled = 0;
  for (const t of Object.values(teeth)) {
    t.pd.forEach((v, i) => {
      if (v != null) {
        probed++;
        if (t.bop[i]) bled++;
      }
    });
  }
  return probed ? Math.round((bled / probed) * 1000) / 10 : 0;
}

/** Furcation applies to molars and upper first premolars. */
export function hasFurcation(fdi: number): boolean {
  const p = fdi % 10;
  const q = Math.floor(fdi / 10);
  return p >= 6 || (p === 4 && (q === 1 || q === 2));
}
