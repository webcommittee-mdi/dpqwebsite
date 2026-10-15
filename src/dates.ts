/**
 * Reads dates however people type them, and formats them one clean way.
 *
 *   4 December 2026 · 4th Dec, 2026 · Sat 4 Dec 2026 · Dec 4, 2026 · 04/12/2026 · 04-12-26 · 2026-12-04
 *   4–5 December 2026 · 30 Nov – 2 Dec 2026 · 4 Dec 2026 to 5 Dec 2026 · 25 November (year guessed)
 */
export type Day = { y: number; m: number; d: number };
export type DateRange = { first: Day; last: Day; start: number; end: number; matched: string };

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// Correct month names anywhere; misspelt ones ("Novemeber") only when a year follows,
// so words like "Market" in "Top 10 Market Movers" are never read as a month.
const MON =
  "((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?![a-z])" +
  "|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]{1,9}(?=\\.?,?\\s+\\d{4}\\b))\\.?";
const D = "(\\d{1,2})(?:st|nd|rd|th)?(?!\\d)";
const AND = "\\s*(?:-|&|\\band\\b|\\bto\\b|,)\\s*";
const Y = "(\\d{4}|\\d{2}(?!\\d))";

const FULL = MONTH_NAMES.map((m) => m.toLowerCase());
const STRICT = /^(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|june?|july?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?|dec(ember)?)\.?$/i;

/** Edit distance, for accepting small spelling mistakes in month names. */
function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

/** "dec", "December", "Decemeber" -> 12; "Markets" -> 0 (not a month) */
const month = (s: string) => {
  const w = s.toLowerCase().replace(/\.$/, "");
  const i = MONTHS.indexOf(w.slice(0, 3));
  if (i < 0) return 0;
  return STRICT.test(w) || distance(w, FULL[i]) <= 2 ? i + 1 : 0;
};
const year = (s?: string) => (!s ? 0 : s.length === 2 ? 2000 + Number(s) : Number(s));

/** 9 am India time on that day */
export const dayStart = (d: Day) => Date.UTC(d.y, d.m - 1, d.d, 3, 30);
/** midnight India time at the end of that day */
export const dayEnd = (d: Day) => Date.UTC(d.y, d.m - 1, d.d + 1, -5, -30);

const todayIST = () => {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [y, m, d] = p.split("-").map(Number);
  return { y, m, d };
};

type Hit = { days: { y: number; m: number; d: number }[]; index: number; length: number };

/** Finds every date (or day range) in a piece of text, in order. */
function scan(text: string): Hit[] {
  // Weekday names are blanked out (same length, so positions still match the original text).
  const t = text
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(day|nesday|sday|urday)?\b\.?,?/g, (w) => " ".repeat(w.length));
  const hits: Hit[] = [];
  const taken = new Array(t.length).fill(false);
  const patterns: [RegExp, (m: RegExpExecArray) => Hit["days"]][] = [
    // 20-22 november 2026, 4th & 5th dec, 4 and 5 december, 4, 5 december
    [new RegExp(`\\b${D}${AND}${D}\\s+${MON}(?:,?\\s+${Y})?`, "g"), (m) => [
      { d: +m[1], m: month(m[3]), y: year(m[4]) },
      { d: +m[2], m: month(m[3]), y: year(m[4]) },
    ]],
    // november 20-22, 2026
    [new RegExp(`\\b${MON}\\s+${D}${AND}${D}(?:,?\\s+${Y})?`, "g"), (m) => [
      { d: +m[2], m: month(m[1]), y: year(m[4]) },
      { d: +m[3], m: month(m[1]), y: year(m[4]) },
    ]],
    // 04/12-05/12/2026
    [/(?<![\d./-])(\d{1,2})[/.](\d{1,2})\s*-\s*(\d{1,2})[/.](\d{1,2})[/.](\d{4}|\d{2})(?!\d)/g, (m) => [
      { d: +m[1], m: +m[2], y: year(m[5]) },
      { d: +m[3], m: +m[4], y: year(m[5]) },
    ]],
    // 4-5/12/2026
    [/(?<![\d./-])(\d{1,2})\s*[-&]\s*(\d{1,2})[/.](\d{1,2})[/.](\d{4}|\d{2})(?!\d)/g, (m) => [
      { d: +m[1], m: +m[3], y: year(m[4]) },
      { d: +m[2], m: +m[3], y: year(m[4]) },
    ]],
    // 04/12/2026, 4-12-26 (day first, the Indian way). Checked before year-first dates so
    // "04/12/2026-05/12/2026" isn't misread as "2026-05/12".
    [/(?<![\d./])(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2})(?!\d)/g, (m) => [{ d: +m[1], m: +m[2], y: year(m[3]) }]],
    // 2026-12-04
    [/(?<![\d./-])(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/g, (m) => [{ y: +m[1], m: +m[2], d: +m[3] }]],
    // 4 december 2026, 4th dec
    [new RegExp(`\\b${D}\\s+${MON}(?:,?\\s+${Y})?`, "g"), (m) => [{ d: +m[1], m: month(m[2]), y: year(m[3]) }]],
    // december 4, 2026
    [new RegExp(`\\b${MON}\\s+${D}(?:,?\\s+${Y})?`, "g"), (m) => [{ d: +m[2], m: month(m[1]), y: year(m[3]) }]],
  ];
  for (const [re, toDays] of patterns) {
    for (const m of t.matchAll(re)) {
      const i = m.index!;
      if (taken.slice(i, i + m[0].length).some(Boolean)) continue;
      const days = toDays(m as RegExpExecArray);
      if (days.some((x) => x.m < 1 || x.m > 12 || x.d < 1 || x.d > 31)) continue;
      for (let k = i; k < i + m[0].length; k++) taken[k] = true;
      hits.push({ days, index: i, length: m[0].length });
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

/**
 * The first and last day mentioned in `text`, or null if there is no date in it.
 * Missing years are filled in from a later date in the text, or else the next time
 * that date comes round (a date up to 30 days ago still counts as this year).
 */
export function readDates(text: string): DateRange | null {
  const hits = scan(text);
  if (!hits.length) return null;
  const days = hits.flatMap((h) => h.days);
  const knownYear = [...days].reverse().find((x) => x.y)?.y;
  const today = todayIST();
  for (const x of days) {
    if (x.y) continue;
    if (knownYear) x.y = knownYear;
    else {
      const monthAgo = dayStart(today) - 30 * 86400_000;
      x.y = dayEnd({ ...x, y: today.y }) >= monthAgo ? today.y : today.y + 1;
    }
  }
  const first = days[0];
  const last = days[days.length - 1];
  if (dayStart(last) < dayStart(first) && last.y === first.y) first.y -= 1; // "30 Dec - 2 Jan 2027"
  const startIdx = hits[0].index;
  const end = hits[hits.length - 1];
  return { first, last, start: dayStart(first), end: dayEnd(last), matched: text.slice(startIdx, end.index + end.length) };
}

/** 9 am IST on the first day, or NaN. */
export const parseDate = (text: string) => readDates(text)?.start ?? NaN;
/** Midnight IST after the last day, or NaN. */
export const endOfLastDay = (text: string) => readDates(text)?.end ?? NaN;

/** "4–5 December 2026", "30 November – 2 December 2026", "4 December 2026" */
export function formatRange(r: DateRange): string {
  const { first: a, last: b } = r;
  const one = (x: Day, withYear = true) => `${x.d} ${MONTH_NAMES[x.m - 1]}${withYear ? ` ${x.y}` : ""}`;
  if (a.y === b.y && a.m === b.m && a.d === b.d) return one(a);
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MONTH_NAMES[a.m - 1]} ${a.y}`;
  if (a.y === b.y) return `${one(a, false)} – ${one(b)}`;
  return `${one(a)} – ${one(b)}`;
}

/** Any date text, tidied if it can be read ("04/12/2026" -> "4 December 2026"). */
export function tidyDate(text: string): string {
  const r = readDates(text);
  if (!r) return text.trim();
  const rest = text.replace(r.matched, "").replace(/\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(day|nesday|sday|urday)?\b\.?,?/gi, "").replace(/[\s,\-–—]+|\b(to|till|until|and|from)\b/gi, "");
  return rest ? text.trim() : formatRange(r);
}
