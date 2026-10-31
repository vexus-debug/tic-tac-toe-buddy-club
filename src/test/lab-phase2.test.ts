import { describe, it, expect } from "vitest";
import { createScanBuffer, matchScannedCase, timerElapsedMs, timerPause, timerStart, formatDuration, teethLabel } from "@/lib/labScanner";

const feed = (buf: ReturnType<typeof createScanBuffer>, s: string, gap: number) => {
  let t = 0, out: string | null = null;
  for (const k of [...s.split(""), "Enter"]) { out = buf.push(k, (t += gap)); }
  return out;
};

describe("lab phase 2 rules", () => {
  it("a fast scanner burst ending in Enter is read as a code", () => {
    expect(feed(createScanBuffer(), "LC-0042", 10)).toBe("LC-0042");
  });
  it("normal human typing is not mistaken for a scan", () => {
    expect(feed(createScanBuffer(), "LC-0042", 200)).toBeNull();
  });
  it("scanned codes match case numbers ignoring case and spaces", () => {
    expect(matchScannedCase([{ case_number: "LC-0042" }], " lc-0042 ")).toEqual({ case_number: "LC-0042" });
    expect(matchScannedCase([{ case_number: "LC-0042" }], "LC-9999")).toBeNull();
  });
  it("pausing keeps the work time and stops counting", () => {
    const run = timerStart({ startedAt: null, accumulatedMs: 0 }, 1000);
    const paused = timerPause(run, 61000);
    expect(timerElapsedMs(paused, 999999)).toBe(60000);
    expect(formatDuration(timerElapsedMs(timerStart(paused, 0), 3600000))).toBe("1:01:00");
  });
  it("bridge teeth show abutment and pontic markers", () => {
    expect(teethLabel(["14", "15", "16"], { "14": "abutment", "15": "pontic", "16": "abutment" })).toEqual(["14 (A)", "15 (P)", "16 (A)"]);
  });
});
