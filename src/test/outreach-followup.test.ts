import { describe, it, expect } from "vitest";
import { pickFollowUpRecipients, pickContacts } from "@/pages/admin/AdminOutreach";

const now = Date.parse("2026-10-27T00:00:00Z");
const old = "2026-10-20T00:00:00Z";
const r = (o: object) => ({ status: "delivered", open_count: 0, click_count: 0, sent_at: old, ...o });

describe("follow-up rules", () => {
  it("did not open excludes openers", () => {
    expect(pickFollowUpRecipients([r({}), r({ open_count: 1 })], "no_open", 3, now)).toHaveLength(1);
  });
  it("opened but did not click", () => {
    expect(pickFollowUpRecipients([r({}), r({ open_count: 2 }), r({ open_count: 1, click_count: 1 })], "open_no_click", 3, now)).toHaveLength(1);
  });
  it("skips bounced, unsubscribed and too-recent sends", () => {
    const rows = [r({ status: "bounced" }), r({ status: "unsubscribed" }), r({ sent_at: "2026-10-26T12:00:00Z" })];
    expect(pickFollowUpRecipients(rows, "unengaged", 3, now)).toHaveLength(0);
  });
});

describe("contact picker", () => {
  it("never includes unsubscribed or bounced contacts", () => {
    const cs = [{ status: "new", tags: [], specialty: null }, { status: "unsubscribed", tags: [], specialty: null }, { status: "bounced", tags: [], specialty: null }];
    expect(pickContacts(cs, "all", "all", "all")).toHaveLength(1);
  });
});
