// Code 128 (set B) encoder → module widths. Pure, no dependencies.
const PATTERNS = [
  "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
  "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
  "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
  "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
  "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
  "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
  "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
  "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
  "114131","311141","411131","211412","211214","211232","2331112",
];
const START_B = 104;
const STOP = 106;

/** Returns the check-summed code values for `text` in Code 128 set B. */
export function code128Values(text: string): number[] {
  const vals = [START_B];
  for (const ch of text) {
    const v = ch.charCodeAt(0) - 32;
    if (v < 0 || v > 94) throw new Error(`Unsupported barcode character: ${ch}`);
    vals.push(v);
  }
  let sum = START_B;
  for (let i = 1; i < vals.length; i++) sum += vals[i] * i;
  vals.push(sum % 103, STOP);
  return vals;
}

/** SVG markup for `text` as a Code 128 barcode. */
export function code128Svg(text: string, height = 56, module = 2): string {
  const widths = code128Values(text).map((v) => PATTERNS[v]).join("");
  let x = 10 * module;
  let rects = "";
  for (let i = 0; i < widths.length; i++) {
    const w = Number(widths[i]) * module;
    if (i % 2 === 0) rects += `<rect x="${x}" y="0" width="${w}" height="${height}"/>`;
    x += w;
  }
  const total = x + 10 * module;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${height}" width="${total}" height="${height}" fill="#000" role="img" aria-label="Barcode ${text}">${rects}</svg>`;
}
