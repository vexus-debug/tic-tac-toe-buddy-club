import { describe, it, expect } from "vitest";
import { benchTasks } from "@/lib/labBench";

const c = (id: string, o: any) => ({ id, status: "design", technician_id: "t1", due_date: null, ...o });

describe("technician bench", () => {
  it("shows only my cases on active bench stages", () => {
    const r = benchTasks([c("a", {}), c("b", { technician_id: "t2" }), c("c", { status: "ready" }), c("d", { status: "on_hold" })], "t1");
    expect(r.map((x) => x.id)).toEqual(["a"]);
  });
  it("rush first, then earliest due date", () => {
    const r = benchTasks([c("late", { due_date: "2026-11-05" }), c("soon", { due_date: "2026-11-01" }), c("rush", { is_urgent: true, due_date: "2026-11-09" })], "t1");
    expect(r.map((x) => x.id)).toEqual(["rush", "soon", "late"]);
  });
  it("no staff profile means no tasks", () => {
    expect(benchTasks([c("a", {})], null)).toEqual([]);
  });
});
