// Dot-command SOAP macros: typing ".name" then space/tab expands into a template.
export const SOAP_MACROS: Record<string, string> = {
  "endo-prep":
    "Endodontic access prepared under rubber dam isolation. Working length established by apex locator and confirmed radiographically: __ mm. Canals irrigated with 2.5% NaOCl and 17% EDTA. Master apical file: size __. Canals dried with paper points.",
  "post-op":
    "Post-operative instructions given verbally and in writing. Advised soft diet for 24 hours, avoid hot drinks until anaesthesia wears off, analgesics as prescribed. Patient to call if severe pain, swelling or bleeding.",
  "comp-molar":
    "Caries excavated under LA. Selective enamel etch, bonding agent applied and light-cured. Composite placed incrementally and cured. Occlusion checked and adjusted, restoration polished.",
  "la-ids":
    "Local anaesthesia: IDB with 2% lidocaine 1:80,000 adrenaline, 2.2 ml. Aspiration negative. Good anaesthesia achieved.",
  "ext-simple":
    "Simple extraction under LA. Tooth luxated and delivered intact. Socket inspected, haemostasis achieved with gauze pressure. Post-extraction instructions given.",
  "scale":
    "Full-mouth supragingival and subgingival scaling with ultrasonic scaler, followed by polishing. Oral hygiene instructions reinforced.",
};

/** If the text ends with ".macro" + a just-typed space, return expanded text; otherwise null. */
export function expandMacro(text: string, macros: Record<string, string> = SOAP_MACROS): string | null {
  const m = text.match(/(^|\s)\.([a-z0-9-]+)$/i);
  if (!m) return null;
  const body = macros[m[2].toLowerCase()];
  if (!body) return null;
  return text.slice(0, text.length - m[2].length - 1) + body + " ";
}
