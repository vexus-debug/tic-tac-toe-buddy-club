// Pure, client-safe helpers that turn a campaign template into a ready-to-send
// email for one recipient (merge tags, open pixel, click tracking, headers).

export const OUTREACH_BASE_URL = "https://clinexus.com.ng";

export interface CompileInput {
  html: string;
  text?: string | null;
  subject: string;
  token: string;
  trackOpens: boolean;
  trackClicks: boolean;
  vars: Record<string, string | null | undefined>;
  baseUrl?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Replaces {{tag}} or {{tag|fallback}} with recipient values. */
export function applyMergeTags(input: string, vars: CompileInput["vars"], escape: boolean) {
  return input.replace(/\{\{\s*([a-z0-9_]+)\s*(?:\|\s*([^}]*?))?\s*\}\}/gi, (_m, key: string, fb?: string) => {
    const v = vars[key.toLowerCase()];
    const out = v != null && String(v).trim() !== "" ? String(v) : (fb ?? "");
    return escape ? escapeHtml(out) : out;
  });
}

export function unsubscribeUrl(token: string, baseUrl = OUTREACH_BASE_URL) {
  return `${baseUrl}/api/public/outreach/unsubscribe?t=${token}`;
}

export function compileEmail(i: CompileInput) {
  const base = i.baseUrl ?? OUTREACH_BASE_URL;
  const unsub = unsubscribeUrl(i.token, base);
  const vars = { ...i.vars, unsubscribe_url: unsub };
  let html = applyMergeTags(i.html, vars, true);

  if (i.trackClicks) {
    html = html.replace(/(<a\b[^>]*?\bhref\s*=\s*)(["'])(.*?)\2/gi, (m, pre: string, q: string, href: string) => {
      const url = href.replace(/&amp;/g, "&");
      if (!/^https?:\/\//i.test(url) || url.includes("/api/public/outreach/")) return m;
      const tracked = `${base}/api/public/outreach/track-click?t=${i.token}&url=${encodeURIComponent(url)}`;
      return `${pre}${q}${tracked.replace(/&/g, "&amp;")}${q}`;
    });
  }

  if (!/\{\{\s*unsubscribe_url|\/outreach\/unsubscribe/i.test(i.html)) {
    html += `<p style="font-size:12px;color:#888;margin-top:24px">Don't want these emails? <a href="${unsub}">Unsubscribe</a>.</p>`;
  }

  if (i.trackOpens) {
    const pixel = `<img src="${base}/api/public/outreach/track-open?t=${i.token}" width="1" height="1" alt="" style="display:none" />`;
    html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${pixel}</body>`) : html + pixel;
  }

  const textBase = i.text ? applyMergeTags(i.text, vars, false) : undefined;
  const text = textBase ? `${textBase}\n\nUnsubscribe: ${unsub}` : undefined;

  return {
    subject: applyMergeTags(i.subject, vars, false),
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${unsub}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
