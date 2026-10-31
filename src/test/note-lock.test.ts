import { describe, it, expect } from "vitest";
import { isNoteLocked } from "@/lib/noteLock";

const now = new Date("2026-10-29T12:00:00Z").getTime();

describe("clinical note lock", () => {
  it("stays editable within 24 hours", () => {
    expect(isNoteLocked({ created_at: "2026-10-28T13:00:00Z" }, now)).toBe(false);
  });
  it("locks after 24 hours", () => {
    expect(isNoteLocked({ created_at: "2026-10-28T11:59:00Z" }, now)).toBe(true);
  });
  it("locks immediately once signed", () => {
    expect(isNoteLocked({ created_at: "2026-10-29T11:00:00Z", signed_at: "2026-10-29T11:30:00Z" }, now)).toBe(true);
  });
});
