/**
 * Everything the Delphique team can change lives in /content.
 * This file reads those text files and photo folders and turns them into plain
 * data for the pages. Pages never hard-code content.
 *
 * It is deliberately forgiving: it accepts the mistakes a non-technical editor is
 * likely to make (wrong capitals, "Key: value", text around links, Indian date
 * formats, files saved as "photo.jpg.jpg", sample files left behind, …) and lists
 * anything it could not understand on the hidden /check page.
 *
 * Photos are resized and converted to WebP during the build (vite-imagetools),
 * so the team can upload full-size phone photos without slowing the site down.
 */
import { endOfLastDay, formatRange, readDates, tidyDate, type DateRange } from "./dates";

/** Things that were ignored or looked wrong; shown on the hidden /check page. */
export type Problem = { what: string; fix: string };
export const problems: Problem[] = [];
const note = (what: string, fix: string) => {
  if (!problems.some((p) => p.what === what)) problems.push({ what, fix });
};
/** Every file in /content (names only), so unusable files can be pointed out. */
import contentFiles from "virtual:content-files";

/* ── Text files ────────────────────────────────────────────────────────── */

const textFiles = import.meta.glob<string>("/content/*.{txt,TXT,Txt}", { eager: true, import: "default", query: "?raw" });

/** "Site (1).TXT", "site.txt.txt", "site copy.txt" all count as site.txt */
const textFileKey = (name: string) =>
  name.toLowerCase().replace(/(\.txt)+$/i, "").replace(/\s*\(\d+\)$|\s*[-_ ]copy$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function textFile(key: string): { name: string; raw: string } {
  const matches = Object.keys(textFiles).filter((p) => textFileKey(fileName(p)) === key);
  const exact = matches.find((p) => fileName(p) === `${key}.txt`);
  const hit = exact ?? matches[0];
  for (const extra of matches.filter((p) => p !== hit)) {
    note(`content/${fileName(extra)} is a second copy of ${key}.txt and is being ignored.`, `Delete "${fileName(extra)}" and make your changes in ${fileName(hit!)}.`);
  }
  return hit ? { name: fileName(hit), raw: textFiles[hit] } : { name: `${key}.txt`, raw: "" };
}

/* ── Parsing `key = value` files ───────────────────────────────────────── */

type Fields = Map<string, string[]>;
type Section = { id: string; fields: Fields; line: number };

/** "Countdown To:" / "countdown-to" / "COUNTDOWN TO" -> "countdown_to" */
const normKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

/** Common other names people use for a key. */
const ALIASES: Record<string, string> = {
  stats: "stat", statistic: "stat", statistics: "stat", number: "stat", numbers: "stat",
  date: "dates", event_date: "dates", event_dates: "dates", delphique_dates: "dates",
  countdown: "countdown_to", countdown_date: "countdown_to", count_down_to: "countdown_to", countdown_till: "countdown_to",
  announcements: "announcement", news: "announcement", notice: "announcement",
  headlines: "headline", heading: "headline",
  registration: "register", registrations: "register", register_link: "register", registration_link: "register", register_now: "register",
  insta: "instagram", ig: "instagram", instagram_link: "instagram", linked_in: "linkedin", linkedin_link: "linkedin", yt: "youtube",
  mail: "email", e_mail: "email", email_id: "email", mail_id: "email",
  mobile: "phone", phone_number: "phone", contact_number: "phone", whatsapp: "phone",
  contacts: "contact", contact_person: "contact", contact_people: "contact", poc: "contact", point_of_contact: "contact",
  venue_address: "address", footer_address: "address",
  join: "join_team", recruitment: "join_team", join_the_team: "join_team", recruitment_form: "join_team",
  partner: "partner_with_us", sponsor: "partner_with_us", sponsorship: "partner_with_us", partner_link: "partner_with_us",
  brochure_link: "brochure", brochure_pdf: "brochure",
  points: "point", bullet: "point", bullets: "point", bullet_point: "point",
  name: "title", event_name: "title",
  events: "event", joint_event: "event", joint_events: "event",
};
const canon = (k: string) => {
  const n = normKey(k);
  if (ALIASES[n]) return ALIASES[n];
  // register_comedy_night, Register_Comedy Night, register-comedy-night: all the same
  const reg = n.match(/^(?:register|registration|reg)_(.+)$/);
  return reg ? `register_${reg[1]}` : n;
};

/** Removes quotes people wrap values in; `""` counts as empty. */
const unquote = (v: string) => {
  const t = v.trim();
  const m = t.match(/^["“”'‘’](.*)["“”'‘’]$/);
  return (m ? m[1] : t).trim();
};

/** Settings whose text may run over several lines. */
const LONG_TEXT = new Set(["intro", "about_delphique", "about_mdi", "mission", "vision", "values"]);

type ParseOptions = {
  /** settings this file understands (others are listed on /check) */
  known: Set<string>;
  /** joint-events.txt: a line without "=" is a new entry for this key */
  bare?: string;
  /** events.txt: a second "title =" in one block starts a new event */
  splitOn?: string;
};

/**
 * Reads `key = value` lines, `# notes` and `[section]` headers. Also accepts
 * `Key: value` for known keys, and joins a line without "=" onto the line above
 * (a paragraph or link that wrapped onto the next line).
 */
/** How each setting was actually typed, for messages on /check. */
const rawKeys = new Map<string, string>();

function parse(file: { name: string; raw: string }, opts: ParseOptions): { root: Fields; sections: Section[] } {
  const { known, bare, splitOn } = opts;
  const root: Fields = new Map();
  const sections: Section[] = [];
  let current = root;
  let lastKey = "";
  const add = (key: string, value: string) => {
    if (!current.has(key)) current.set(key, []);
    current.get(key)!.push(value); // empty values kept for now, so a link on the next line can attach
    lastKey = key;
  };
  file.raw.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.replace(/^\uFEFF/, "").trim();
    if (!line || line.startsWith("#")) return;
    const header = line.match(/^\[(.+)\]$/);
    if (header) {
      current = new Map();
      sections.push({ id: slug(header[1]), fields: current, line: i + 1 });
      lastKey = "";
      return;
    }
    // An "=" inside a web address (…?usp=sharing) isn't a setting's "=".
    const urlAt = line.search(/https?:\/\/|www\./i);
    let eq = line.indexOf("=");
    if (urlAt >= 0 && eq > urlAt) eq = -1;
    if (bare && eq > 0 && /\|/.test(line.slice(0, eq))) eq = -1; // "Name | Club | Date | link" without "event ="
    const colon = line.match(/^([A-Za-z][A-Za-z _-]{1,30}):\s*(.*)$/);
    const onlyUrl = /^(https?:\/\/|www\.)\S+$/i.test(line);
    let key = "";
    let value = "";
    if (eq > 0 && !/^https?:/i.test(line)) {
      key = canon(line.slice(0, eq));
      value = unquote(line.slice(eq + 1));
    } else if (colon && known.has(canon(colon[1]))) {
      key = canon(colon[1]);
      value = unquote(colon[2]);
    } else if (bare && !onlyUrl && (line.includes("|") || readDates(line) || urlAt >= 0)) {
      // joint-events.txt: a line that looks like an event, just without "event ="
      key = bare;
      value = unquote(line.replace(/^event\s*[:-]\s*/i, ""));
    } else if (lastKey && (LONG_TEXT.has(lastKey) || onlyUrl || !current.get(lastKey)!.slice(-1)[0])) {
      // continuation of the line above (a wrapped paragraph, or a link put on the next line)
      const list = current.get(lastKey)!;
      list[list.length - 1] = `${list[list.length - 1]} ${unquote(line)}`.trim();
      if (!onlyUrl) {
        note(
          `${file.name}, line ${i + 1}: "${line.slice(0, 50)}" was added to the end of the line above it.`,
          "That's right if your text ran onto a new line. If it's a note for yourself, start it with #.",
        );
      }
      return;
    } else {
      note(
        `${file.name}, line ${i + 1}: "${line.slice(0, 60)}" was ignored.`,
        `Notes for yourself must start with #. Settings need an = sign, like  name = value`,
      );
      return;
    }
    if (!known.has(key) && !key.startsWith("register_")) {
      note(
        `${file.name}, line ${i + 1}: "${line.slice(0, eq > 0 ? eq : 30).trim()}" isn't a setting the website knows, so it was ignored.`,
        `Check the word before the = sign against the examples in ${file.name}.`,
      );
    }
    rawKeys.set(key, rawKeys.get(key) ?? (eq > 0 ? line.slice(0, eq).trim() : key));
    if (splitOn && key === splitOn && (current.get(key) ?? []).some(Boolean)) {
      // A new title inside the same block: the [id] line for a new event was forgotten.
      current = new Map();
      sections.push({ id: "", fields: current, line: i + 1 });
    }
    add(key, value);
  });
  for (const fields of [root, ...sections.map((x) => x.fields)]) {
    for (const [k, v] of fields) fields.set(k, v.map((x) => x.trim()).filter(Boolean));
  }
  return { root, sections };
}

/** Single settings: the LAST filled-in line wins (people add a new line under the old one). */
const one = (f: Fields, key: string) => {
  const v = f.get(key);
  return v && v.length ? v[v.length - 1] : "";
};
const all = (f: Fields, key: string) => f.get(key) ?? [];

/** "835+ | Registrations" or "835+ Registrations" -> { value, label } */
function pair(s: string) {
  if (s.includes("|")) {
    const [value, ...rest] = s.split("|");
    return { value: value.trim(), label: rest.join("|").trim() };
  }
  const m = s.trim().match(/^(\S*[\d₹$#]\S*)\s+(.+)$/);
  return m ? { value: m[1], label: m[2] } : { value: s.trim(), label: "" };
}

export function slug(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ── File name helpers ─────────────────────────────────────────────────── */

function fileName(path: string) {
  return path.split("/").pop() ?? "";
}
const folderName = (path: string) => path.split("/").slice(-2, -1)[0] ?? "";
/** Removes the file type, including a doubled one like "photo.jpg.jpg" (common on Windows). */
const stripExt = (name: string) =>
  name.replace(/(\.(jpe?g|jfif|png|webp|svg|gif|heic|heif|avif|tiff?|bmp|pdf))+$/i, "").replace(/\s*\(\d+\)\s*$/, ""); // also "photo (2)"
const SAMPLE = /^\s*sample\s*[-–—_:]?\s*/i;
const isSample = (path: string) => SAMPLE.test(fileName(path)) || /(^|\/)sample\b/i.test(folderName(path));

/**
 * "01 - Name - Role" -> ["Name", "Role"]. Forgives a missing space on one side of
 * the dash, a missing number separator ("01 Name"), and "Name-Role, Company".
 */
function nameParts(name: string) {
  let s = stripExt(name).replace(SAMPLE, "");
  s = s.replace(/^\s*\d{1,3}\s*[-–—._)]\s*|^\s*\d{1,3}\s+(?=\D)/, "");
  let parts = s.split(/\s+[-–—]\s*|\s*[-–—]\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) {
    const bracket = s.match(/^(.+?)\s*\((.+)\)\s*$/); // "Priya Nair (CEO, Acme Ltd)"
    const dashComma = s.includes(",") ? s.lastIndexOf("-", s.indexOf(",")) : -1; // "Rahul Verma-CTO, Beta Corp"
    if (bracket) parts = [bracket[1].trim(), bracket[2].trim()];
    else if (dashComma > 0) parts = [s.slice(0, dashComma).trim(), s.slice(dashComma + 1).trim()];
    else if (s.includes(",")) parts = [s.slice(0, s.indexOf(",")).trim(), s.slice(s.indexOf(",") + 1).trim()]; // "Priya Nair, CEO, Acme"
  }
  return parts;
}
/** Small words that stay lower-case inside a title ("30 Years of Legacy"). */
const SMALL_WORDS = /^(a|an|and|as|at|but|by|for|in|of|on|or|the|to|with|via|vs\.?|x)$/i;
/**
 * "Panel discussion" -> "Panel Discussion" for captions and group names taken from file and
 * folder names. Only lower-case first letters change; anything typed in capitals (MDI, B-School)
 * stays as it is. (File names can't be fixed by renaming: Macs treat "a.jpg" and "A.jpg" as one file.)
 */
export function titleCase(s: string) {
  return s
    .split(/(\s+)/)
    .map((w, i) => (i > 0 && SMALL_WORDS.test(w) ? w : w.replace(/^([("'“‘]*)([a-z])/, (_, p: string, c: string) => p + c.toUpperCase())))
    .join("");
}
const byPath = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

/* ── Image globs (one per size; paths must be written out literally) ───── */

type Meta = { src: string; width: number; height: number };
// Photos are processed at build time. A photo that can't be read comes through as null.
type Maybe<T> = T | null;

const heroLarge = import.meta.glob<Maybe<Meta>>("/content/photos/hero/*.{jpg,jpeg,png,webp,heic,heif,jfif,avif,tif,tiff,JPG,JPEG,PNG,WEBP,HEIC,HEIF,JFIF,AVIF,TIF,TIFF}", {
  eager: true, import: "default", query: { w: "1920", format: "webp", quality: "72", withoutEnlargement: "", as: "meta:src;width;height" },
});
const heroSmall = import.meta.glob<Maybe<string>>("/content/photos/hero/*.{jpg,jpeg,png,webp,heic,heif,jfif,avif,tif,tiff,JPG,JPEG,PNG,WEBP,HEIC,HEIF,JFIF,AVIF,TIF,TIFF}", {
  eager: true, import: "default", query: { w: "900", format: "webp", quality: "70", withoutEnlargement: "" },
});
const eventPhotos = import.meta.glob<Maybe<Meta>>("/content/photos/events/*.{jpg,jpeg,png,webp,heic,heif,jfif,avif,tif,tiff,JPG,JPEG,PNG,WEBP,HEIC,HEIF,JFIF,AVIF,TIF,TIFF}", {
  eager: true, import: "default", query: { w: "1080", format: "webp", quality: "78", withoutEnlargement: "", as: "meta:src;width;height" },
});
const sitePhotos = import.meta.glob<Maybe<string>>("/content/photos/site/*.{jpg,jpeg,png,webp,heic,heif,jfif,avif,tif,tiff,JPG,JPEG,PNG,WEBP,HEIC,HEIF,JFIF,AVIF,TIF,TIFF}", {
  eager: true, import: "default", query: { w: "1400", format: "webp", quality: "72", withoutEnlargement: "" },
});
const galleryThumbs = import.meta.glob<Maybe<Meta>>("/content/photos/gallery/**/*.{jpg,jpeg,png,webp,heic,heif,jfif,avif,tif,tiff,JPG,JPEG,PNG,WEBP,HEIC,HEIF,JFIF,AVIF,TIF,TIFF}", {
  eager: true, import: "default", query: { w: "720", format: "webp", quality: "68", withoutEnlargement: "", as: "meta:src;width;height" },
});
const galleryFull = import.meta.glob<Maybe<string>>("/content/photos/gallery/**/*.{jpg,jpeg,png,webp,heic,heif,jfif,avif,tif,tiff,JPG,JPEG,PNG,WEBP,HEIC,HEIF,JFIF,AVIF,TIF,TIFF}", {
  eager: true, import: "default", query: { w: "2000", format: "webp", quality: "78", withoutEnlargement: "" },
});
const teamPhotos = import.meta.glob<Maybe<string>>("/content/photos/team/**/*.{jpg,jpeg,png,webp,heic,heif,jfif,avif,tif,tiff,JPG,JPEG,PNG,WEBP,HEIC,HEIF,JFIF,AVIF,TIF,TIFF}", {
  eager: true, import: "default", query: { w: "480", h: "600", fit: "cover", position: "top", format: "webp", quality: "70" },
});
const speakerPhotos = import.meta.glob<Maybe<string>>("/content/photos/speakers/**/*.{jpg,jpeg,png,webp,heic,heif,jfif,avif,tif,tiff,JPG,JPEG,PNG,WEBP,HEIC,HEIF,JFIF,AVIF,TIF,TIFF}", {
  eager: true, import: "default", query: { w: "480", h: "600", fit: "cover", position: "top", format: "webp", quality: "72" },
});
const logoRaster = import.meta.glob<Maybe<string>>("/content/logos/**/*.{png,webp,jpg,jpeg,jfif,heic,avif,tif,tiff,PNG,WEBP,JPG,JPEG,JFIF,HEIC,AVIF,TIF,TIFF}", {
  eager: true, import: "default", query: { w: "800", format: "webp", lossless: "", withoutEnlargement: "" },
});
const logoVector = import.meta.glob<string>("/content/logos/**/*.{svg,SVG}", {
  eager: true, import: "default", query: "?url",
});
const jointPosters = import.meta.glob<Maybe<Meta>>("/content/photos/joint-events/*.{jpg,jpeg,png,webp,heic,heif,jfif,avif,tif,tiff,JPG,JPEG,PNG,WEBP,HEIC,HEIF,JFIF,AVIF,TIF,TIFF}", {
  eager: true, import: "default", query: { w: "640", format: "webp", quality: "80", withoutEnlargement: "", as: "meta:src;width;height" },
});
const downloads = import.meta.glob<string>("/content/downloads/*.{pdf,PDF,ppt,pptx,PPT,PPTX,doc,docx,DOC,DOCX,zip,ZIP}", {
  eager: true, import: "default", query: "?url",
});

/** Drops photos that could not be read, and lists them on /check. */
function usable<T>(map: Record<string, Maybe<T>>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [p, v] of Object.entries(map)) {
    if (v) out[p] = v;
    else note(`${p.replace("/content/", "content/")} could not be read as a photo and was skipped.`, "Delete it and upload the photo again (a normal photo from a phone or camera).");
  }
  return out;
}

const hero = { large: usable(heroLarge), small: usable(heroSmall) };
const photos = {
  events: usable(eventPhotos),
  site: usable(sitePhotos),
  galleryThumbs: usable(galleryThumbs),
  galleryFull: usable(galleryFull),
  team: usable(teamPhotos),
  speakers: usable(speakerPhotos),
  posters: usable(jointPosters),
};
const logos: Record<string, string> = { ...usable(logoRaster), ...logoVector };

/** Files directly inside `folder` (not in subfolders). */
const inFolder = (map: Record<string, unknown>, folder: string) =>
  Object.keys(map).filter((p) => p.startsWith(folder) && !p.slice(folder.length).includes("/"));

/**
 * Finds an image by name ("cerebro" matches "Cerebro.JPG", "SAMPLE - cerebro.jpg").
 * A real photo always beats a sample one. With `loose`, a file whose name contains
 * the wanted name (or the other way round) also counts, if it's the only one.
 */
function findByName<T>(map: Record<string, T>, folder: string, name: string, loose = false): T | undefined {
  const want = slug(name);
  if (!want) return undefined;
  const files = inFolder(map, folder);
  const key = (p: string) => slug(stripExt(fileName(p)).replace(SAMPLE, ""));
  const pick = (list: string[]) => list.find((p) => !isSample(p)) ?? list[0];
  let hit = pick(files.filter((p) => key(p) === want));
  if (!hit && loose) {
    const near = files.filter((p) => key(p).includes(want) || want.includes(key(p)));
    if (near.length === 1) hit = near[0];
  }
  return hit ? map[hit] : undefined;
}

{
  // Files in /content the website can't use (videos, zips, documents in photo folders…)
  const photoExt = /\.(jpe?g|png|webp|heic|heif|jfif|avif|tiff?|bmp|gif|svg)$/i;
  for (const f of contentFiles as string[]) {
    const name = f.split("/").pop() ?? "";
    if (/^(\.|HOW-TO\.txt$|README\.md$)/i.test(name)) continue;
    if (f.startsWith("photos/") || f.startsWith("logos/")) {
      if (!photoExt.test(f)) note(`content/${f} isn't a photo, so it isn't shown.`, /\.zip$/i.test(f) ? "Unzip it on your laptop and upload the photos inside." : /\.(mov|mp4|m4v|avi)$/i.test(f) ? "Videos can't go on the website. Upload photos only." : "Upload photos (JPG, PNG or iPhone photos) only.");
    } else if (f.startsWith("downloads/")) {
      if (!/\.(pdf|pptx?|docx?|zip)$/i.test(f)) note(`content/${f} can't be offered as a download.`, "Upload PDFs here.");
    } else if (!f.includes("/") && !/\.txt$/i.test(f)) {
      note(`content/${f} isn't used by the website.`, "Photos go in content/photos, logos in content/logos, PDFs in content/downloads.");
    }
  }
}

/* ── Links ─────────────────────────────────────────────────────────────── */

const LINK_KEYS = new Set([
  "register", "join_team", "partner_with_us", "brochure", "email", "phone", "map", "contact", "address",
  "instagram", "linkedin", "youtube", "mdi_website",
]);
const linksFile = textFile("links");
const links = parse(linksFile, { known: LINK_KEYS }).root;

const NONE = /^(none|nil|n\/a|na|no|-+|not applicable|no (registrations?|sign[- ]?ups?|forms?|buttons?|links?)\b.*)\W*$/i;
const CLOSED = /^(closed?|over|ended|registrations? (are |now )?closed)\W*$/i;
const OPEN_NO_LINK = /^(open(ed)?|live|registrations? (are |now )?open)\W*$/i;
const DOC = /\.(pdf|pptx?|docx?|zip)$/i;

const downloadFiles = Object.keys(downloads);
const docKey = (s: string) => slug(stripExt(s.replace(/\.(pptx?|docx?|zip)$/i, "")));

/** Turns whatever was typed into a usable link ("" if blank, none, or not a link). */
export function resolveLink(raw: string): string {
  let v = unquote(raw).replace(/[“”‘’]/g, "").trim();
  if (!v) return "";
  // A web address anywhere in the text: "Link: https://…", "https://… (main form)"
  const url = v.match(/\bhttps?:\/\/[^\s<>"'“”]+/i)?.[0] ?? v.match(/\bwww\.[^\s<>"'“”]+/i)?.[0];
  if (url) return (url.startsWith("www.") ? `https://${url}` : url).replace(/[)\].,;:!?'"”’>]+$/, "");
  v = v.replace(/^[<(\s]+|[>)\s.]+$/g, "");
  if (/^(mailto:|tel:|\/|#)/i.test(v)) return v;
  // A file in content/downloads, matched ignoring capitals, spaces and the file type
  const file = downloadFiles.find((p) => docKey(fileName(p)) === docKey(v));
  if (file) return downloads[file];
  if (DOC.test(v)) return ""; // a file name that isn't there: never treat it as a website
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v) && /\.[a-z]{2,}(\/|$)/i.test(v)) return `https://${v}`;
  return "";
}

const SOCIAL_BASE: Record<string, string> = {
  instagram: "https://www.instagram.com/",
  youtube: "https://www.youtube.com/@",
  linkedin: "https://www.linkedin.com/company/",
};

/** Resolves a links.txt setting to a usable URL ("" when blank). */
export function link(key: string): string {
  const k = canon(key);
  const v = one(links, k);
  if (!v) return "";
  if (SOCIAL_BASE[k]) {
    // "@delphique.mdi" or "delphique.mdi" (a handle, not a web address)
    const handle = v.match(/^@?([A-Za-z0-9._-]+)$/);
    if (handle && !/\.(com|in|org|net|co|io)$/i.test(handle[1])) return SOCIAL_BASE[k] + handle[1];
  }
  if (k === "brochure") return brochureLink(v);
  return resolveLink(v);
}

/** The brochure: the named file, or if that isn't found, the newest-looking PDF in downloads/. */
function brochureLink(v: string) {
  const direct = resolveLink(v);
  if (direct) return direct;
  const pdfs = downloadFiles.filter((p) => /\.pdf$/i.test(p));
  if (!pdfs.length) return "";
  const yearOf = (p: string) => Math.max(0, ...(fileName(p).match(/(?:19|20)\d{2}/g) ?? []).map(Number));
  const best = [...pdfs].sort((a, b) => yearOf(b) - yearOf(a) || byPath(b, a))[0];
  note(`links.txt: the brochure "${v}" wasn't found in content/downloads, so "${fileName(best)}" is used instead.`, `Write the PDF's exact name after brochure = in links.txt.`);
  return downloads[best];
}

/** Every email address and phone number written in links.txt (several are allowed). */
export const contact = {
  emails: [...new Set((one(links, "email").match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) ?? []))].map((e) => ({ href: `mailto:${e}`, text: e })),
  phones: one(links, "phone")
    .split(/\s*(?:[,/;|]|\bor\b|\band\b)\s*/i)
    .map((p) => p.trim())
    .filter((p) => (p.match(/\d/g) ?? []).length >= 8)
    .map((p) => ({ href: `tel:${p.replace(/[^\d+]/g, "")}`, text: p.replace(/^(tel|phone|mobile|ph)[:.\s-]*/i, "") })),
};

/* ── LinkedIn profiles (team.txt) ──────────────────────────────────────── */

/** "linkedin.com/in/x?utm_source=…" -> "https://www.linkedin.com/in/x" */
const cleanLinkedIn = (raw: string) => {
  const url = resolveLink(raw.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?(?:www\.)?linkedin\.com\/\S+/i)?.[0] ?? "");
  if (!url) return "";
  const u = url.startsWith("http") ? url : `https://${url}`;
  return u.replace(/[?#].*$/, "").replace(/\/+$/, "").replace(/^https?:\/\/(?:[a-z]{2,3}\.)?(?:www\.)?linkedin\.com/i, "https://www.linkedin.com");
};

/**
 * team.txt:  linkedin = Name | https://www.linkedin.com/in/…  (one line per person).
 * Matched to team photos (and contact names) by name, ignoring capitals, spaces and dots.
 */
const teamLinks = new Map<string, { name: string; url: string; line: string }>();
for (const line of all(parse(textFile("team"), { known: new Set(["linkedin"]), bare: "linkedin" }).root, "linkedin")) {
  const parts = line.split("|").map((x) => x.trim());
  const url = cleanLinkedIn(line);
  const name = parts.find((x) => x && !/linkedin\.com|https?:|www\./i.test(x)) ?? "";
  if (!name || !url) {
    note(`team.txt: "${line.slice(0, 60)}" needs both a name and a LinkedIn link.`, "Write it as  linkedin = Aarav Sharma | https://www.linkedin.com/in/aarav-sharma");
    continue;
  }
  teamLinks.set(slug(name), { name, url, line });
}
const linkedInFor = (name: string) => teamLinks.get(slug(name))?.url ?? "";

export type ContactPerson = {
  name: string;
  role: string;
  phones: { href: string; text: string }[];
  emails: { href: string; text: string }[];
  linkedin: string;
};

/**
 * People to contact, from  contact = Name | Position | Phone | Email | LinkedIn  lines in links.txt.
 * Parts can come in any order and any can be left out; commas work instead of | too.
 * Without a LinkedIn link on the line, the one in team.txt for the same name is used.
 */
export const contactPeople: ContactPerson[] = all(links, "contact").flatMap((line) => {
  const parts = (line.includes("|") ? line.split("|") : line.split(",")).map((x) => x.trim()).filter(Boolean);
  const person: ContactPerson = { name: "", role: "", phones: [], emails: [], linkedin: "" };
  const words: string[] = [];
  for (const part of parts) {
    const email = part.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/)?.[0];
    if (/linkedin\.com/i.test(part)) person.linkedin = cleanLinkedIn(part);
    else if (email) person.emails.push({ href: `mailto:${email}`, text: email });
    else if ((part.match(/\d/g) ?? []).length >= 8)
      person.phones.push({ href: `tel:${part.replace(/[^\d+]/g, "")}`, text: part.replace(/^(tel|phone|mobile|ph)[:.\s-]*/i, "") });
    else words.push(part);
  }
  person.name = words[0] ?? "";
  person.role = words.slice(1).join(", ");
  person.linkedin ||= linkedInFor(person.name);
  if (!person.name && !person.phones.length && !person.emails.length) return [];
  if (!person.name) note(`links.txt: the contact "${line.slice(0, 50)}" has no name, so only the number or email is shown.`, "Write it as  contact = Name | Position | Phone | Email");
  return [person];
});

/** The address in the footer: address = in links.txt, or else the venue in site.txt (see site below). */
export const contactAddress = one(links, "address");

export const isExternal = (href: string) => /^https?:/i.test(href);
/** Worked out once, so a brochure problem is listed on /check whichever page is opened first. */
export const brochure = link("brochure");

/** A registration button's state, from what's written in links.txt. */
export type Reg = { state: "open" | "live" | "soon" | "closed" | "none"; href: string };
function regFrom(raw: string): Reg {
  const v = unquote(raw).replace(/[“”‘’]/g, "").trim();
  if (NONE.test(v)) return { state: "none", href: "" };
  if (CLOSED.test(v)) return { state: "closed", href: "" };
  if (OPEN_NO_LINK.test(v)) return { state: "live", href: "" }; // "open": registrations are on, no form link yet
  const href = resolveLink(v); // a link anywhere in the text wins ("Closes on 20 Nov: https://…")
  return href ? { state: "open", href } : { state: "soon", href: "" };
}

/* ── Site details ──────────────────────────────────────────────────────── */

const SITE_KEYS = new Set([
  "first_edition", "year", "edition", "dates", "countdown_to", "venue", "announcement", "headline", "intro",
  "stat", "about_delphique", "mission", "vision", "values", "about_mdi", "accreditations", "mdi_rank",
]);
const s = parse(textFile("site"), { known: SITE_KEYS }).root;

/**
 * Year and edition are worked out in the visitor's browser from today's date
 * (India time), so the site moves to the next edition every 1 January without
 * anyone editing a file or rebuilding. `year = 2026` in site.txt pins it instead.
 */
const firstEdition = Number(one(s, "first_edition").match(/\d{4}/)?.[0]) || 1997;
const yearSetting = one(s, "year").match(/^\s*(\d{4})\s*$/)?.[1];
const calendarYear = Number(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric" }).format(new Date()));
const year = yearSetting ? Number(yearSetting) : calendarYear;
const editionNumber = Math.max(1, year - firstEdition + 1);

function ordinal(n: number) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}
function inWords(n: number) {
  const small = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const w = n < 20 ? small[n] : n < 100 ? tens[Math.floor(n / 10)] + (n % 10 ? `-${small[n % 10]}` : "") : String(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

const placeholders: Record<string, string> = {
  year: String(year),
  edition: one(s, "edition") || ordinal(editionNumber),
  years: String(editionNumber),
  "years-in-words": inWords(editionNumber),
};
/** Replaces {year}, {edition}, {years} and {years-in-words} in any text. */
export const fill = (text: string) =>
  text.replace(/\{\s*([a-z-]+)\s*\}/gi, (match, key: string) => placeholders[key.toLowerCase().replace(/\s+/g, "-")] ?? match);

const text = (key: string) => fill(one(s, key));
const texts = (key: string) => all(s, key).map(fill);

/**
 * The event's dates. Once the last day has passed, the dates and countdown are
 * hidden and registration buttons stop pointing at last year's forms.
 */
const datesRange: DateRange | null = readDates(text("dates"));
const countdownRange: DateRange | null = readDates(one(s, "countdown_to")) ?? datesRange;
const eventOver = Boolean(datesRange && Date.now() > datesRange.end);
const eventYear = datesRange?.last.y;
if (text("dates") && !datesRange) note(`site.txt: the dates "${text("dates")}" couldn't be read, so they're shown as written and there's no countdown.`, "Write them like  dates = 4–5 December 2026");
if (datesRange && eventOver && calendarYear === datesRange.last.y && Date.now() - datesRange.end < 7 * 86400_000)
  note(`site.txt: the dates were read as ${formatRange(datesRange)}, which has already passed, so registrations show as closed.`, "If that's wrong, write the dates like  dates = 4–5 December 2026");
if (datesRange && datesRange.start - Date.now() > 400 * 86400_000)
  note(`site.txt: the dates were read as ${formatRange(datesRange)}, more than a year away.`, "If that's wrong, write the dates like  dates = 4–5 December 2026");
if (datesRange && datesRange.last.y < calendarYear)
  note(`site.txt: the dates (${formatRange(datesRange)}) are from an earlier year.`, "Put in this year's dates once they're fixed. Until then, Register buttons say \"Registrations open soon\".");
if (one(s, "countdown_to") && !readDates(one(s, "countdown_to"))) note(`site.txt: countdown_to "${one(s, "countdown_to")}" isn't a date the website can read.`, "Leave countdown_to empty: the countdown uses the dates above.");

/** What a registration button should do right now. */
function liveReg(raw: string): Reg {
  const reg = regFrom(raw);
  if (!eventOver || reg.state === "none") return reg;
  // After the event: "closed" until the new year, then "opens soon" for the next edition.
  return calendarYear > (eventYear ?? calendarYear) ? { state: "soon", href: "" } : { state: "closed", href: "" };
}

/** Announcement text, split into plain text and clickable links. */
function announcementParts(raw: string) {
  const out: { text: string; href?: string }[] = [];
  let rest = raw;
  for (const m of raw.matchAll(/\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+/gi)) {
    const [before, after] = rest.split(m[0]);
    if (before) out.push({ text: before });
    const href = resolveLink(m[0]);
    out.push({ text: m[0].replace(/^https?:\/\//, "").replace(/\/$/, ""), href });
    rest = after ?? "";
  }
  if (rest) out.push({ text: rest });
  return out;
}

export const site = {
  edition: placeholders.edition,
  year: placeholders.year,
  /** the year the dates belong to (for "Speakers at Delphique 2026") */
  eventYear: String(eventYear ?? year),
  dates: eventOver ? "" : tidyDate(text("dates")),
  countdownTo: !eventOver && countdownRange ? countdownRange.start : NaN,
  eventOver,
  venue: text("venue"),
  // An announcement that mentions a date hides itself once that date has passed.
  announcement: (readDates(text("announcement"))?.end ?? Infinity) > Date.now() ? announcementParts(text("announcement")) : [],
  headline: texts("headline"),
  intro: text("intro"),
  stats: texts("stat").map(pair),
  aboutDelphique: texts("about_delphique"),
  mission: text("mission"),
  vision: text("vision"),
  values: text("values"),
  aboutMdi: texts("about_mdi"),
  accreditations: text("accreditations"),
  mdiRank: one(s, "mdi_rank") ? pair(text("mdi_rank")) : null,
  register: liveReg(one(links, "register")),
};

/* ── Events ────────────────────────────────────────────────────────────── */

export type Event = {
  id: string;
  title: string;
  category: string;
  tagline: string;
  stats: { value: string; label: string }[];
  points: string[];
  photo?: string;
  /** width / height of the photo or poster, so it is shown whole */
  photoRatio?: number;
  logo?: string;
  reg: Reg;
};

const EVENT_KEYS = new Set(["title", "category", "tagline", "stat", "point"]);

/**
 * Splits events.txt into events, forgiving copy-paste mistakes:
 *  - a second "title =" inside one block starts a new event (the [id] line was forgotten)
 *  - two events with the same [id] get separate ids from their titles
 *  - a leftover [id] line with nothing under it is ignored
 */
function eventSections(): Section[] {
  const { root, sections } = parse(textFile("events"), { known: EVENT_KEYS, splitOn: "title" });
  const list = root.get("title")?.length ? [{ id: "", fields: root, line: 0 }, ...sections] : sections;
  const seen = new Set<string>();
  return list
    .filter((sec) => {
      const filled = [...sec.fields.values()].some((v) => v.length);
      if (!filled && sec.id) note(`events.txt: [${sec.id}] has nothing under it, so it was left out.`, `Delete the [${sec.id}] line too.`);
      return filled;
    })
    .map((sec) => {
      const title = one(sec.fields, "title");
      let id = sec.id || slug(title);
      if (seen.has(id) && slug(title) && slug(title) !== id) {
        note(`events.txt: two events use [${id}]; "${title}" was given its own ID [${slug(title)}].`, `Change the second [${id}] to [${slug(title)}]. Its photo should be named ${slug(title)}.jpg.`);
        id = slug(title);
      }
      seen.add(id);
      return { ...sec, id };
    });
}

export const events: Event[] = eventSections().map(({ id, fields }) => {
  const title = fill(one(fields, "title")) || id.replace(/-/g, " ");
  const ids = [id, slug(title)];
  const regKey = ids.map((x) => `register_${normKey(x)}`).find((k) => links.has(k));
  const photo = ids.map((x) => findByName(photos.events, "/content/photos/events/", x)).find(Boolean);
  return {
    id,
    title,
    category: fill(one(fields, "category")),
    tagline: fill(one(fields, "tagline")),
    stats: all(fields, "stat").map(fill).map(pair),
    points: all(fields, "point").map(fill),
    photo: photo?.src,
    photoRatio: photo ? photo.width / photo.height : undefined,
    logo: ids.map((x) => findByName(logos, "/content/logos/events/", x)).find(Boolean),
    reg: liveReg(regKey ? one(links, regKey) : ""),
  };
});

// Photos and links that don't belong to any event (usually a typo in the name)
{
  const known = new Set(events.flatMap((e) => [e.id, slug(e.title)]));
  for (const p of inFolder(photos.events, "/content/photos/events/")) {
    const k = slug(stripExt(fileName(p)).replace(SAMPLE, ""));
    if (!known.has(k) && !isSample(p)) note(`content/photos/events/${fileName(p)} doesn't match any event.`, `Rename it to an event's short ID from events.txt, e.g. ${events[0]?.id ?? "cerebro"}.jpg`);
  }
  for (const k of links.keys()) {
    if (!k.startsWith("register_")) continue;
    const id = k.slice("register_".length).replace(/_/g, "-");
    if (!events.some((e) => normKey(e.id) === normKey(id) || normKey(slug(e.title)) === normKey(id))) {
      note(`links.txt: "${rawKeys.get(k) ?? k}" doesn't match any event in events.txt.`, `Use register_ followed by the event's short ID from events.txt, e.g. register_${events[0]?.id ?? "cerebro"}`);
    }
  }
}

/* ── Joint events ──────────────────────────────────────────────────────── */

/** posterRatio = width / height of the poster (0.5 for a phone-story poster, 0.8 for an Instagram post). */
export type JointEvent = { name: string; partner: string; date: string; link: string; poster?: string; posterRatio?: number; endsAt: number; search: string };

const URLISH = /\bhttps?:\/\/\S+|\bwww\.\S+|\b(?:instagram\.com|forms\.gle|unstop\.com|docs\.google\.com|bit\.ly|lu\.ma|linkedin\.com)\/\S*/i;

/**
 * One line each in joint-events.txt:  event = Name | With | Date | Link
 * The parts are recognised by what they look like, so a missing "|" or parts in
 * a different order still work. Only the name is required.
 */
export const jointEvents: JointEvent[] = all(parse(textFile("joint-events"), { known: new Set(["event"]), bare: "event" }).root, "event")
  .map((line) => {
    let link = "";
    let dateRange: DateRange | null = null;
    let dateText = "";
    let time = "";
    const words: string[] = [];
    for (let part of line.split("|").map((x) => x.trim())) {
      // "6 PM", "6:30 pm", "18:00", "6 PM onwards"
      const t = part.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)|\d{1,2}:\d{2})(?:\s*(?:-|to)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?(?:\s+onwards)?\b\.?/i);
      if (t && !time) {
        time = t[0].replace(/\s+/g, " ").trim();
        part = part.replace(t[0], "").replace(/\b(at|from)\s*$/i, "").trim();
      }
      const url = part.match(URLISH)?.[0];
      if (url && !link) {
        link = resolveLink(url.startsWith("http") || url.startsWith("www") ? url : `https://${url}`);
        part = part.replace(url, "").trim();
      }
      if (!dateRange) {
        const r = readDates(part);
        if (r) {
          dateRange = r;
          dateText = r.matched;
          part = part.replace(r.matched, "").replace(/\b(on|from|date)\b:?/gi, "").replace(/[\s,\-–—]+$/g, "").trim();
        }
      }
      if (part) words.push(part);
    }
    const [name = "", partner = "", ...extra] = words;
    const datey = /\b\d{1,2}[/.-]\d{1,2}\b|\b(?:19|20)\d{2}\b|\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}\b/i;
    if (extra.length || (!dateRange && datey.test(partner))) {
      note(
        `joint-events.txt: in "${name}", "${(extra.join(" ") || partner).slice(0, 40)}" couldn't be read as a date, so this event has no date and won't disappear by itself.`,
        "Write the date like  14 November 2026",
      );
    }
    const date = [dateRange ? tidyDate(dateText) : "", time].filter(Boolean).join(", ");
    return {
      name,
      partner: partner.replace(/^with\s+/i, ""),
      date,
      link,
      ...(() => {
        const p = findByName(photos.posters, "/content/photos/joint-events/", name, true);
        return p ? { poster: p.src, posterRatio: p.width / p.height } : {};
      })(),
      endsAt: dateRange ? dateRange.end : endOfLastDay(""),
      search: `${name} ${partner} ${date} ${dateText}`.toLowerCase(),
    };
  })
  .filter((e) => e.name);

for (const p of inFolder(photos.posters, "/content/photos/joint-events/")) {
  const k = slug(stripExt(fileName(p)));
  if (!jointEvents.some((e) => e.poster === photos.posters[p].src) && !jointEvents.some((e) => slug(e.name) === k)) {
    note(`content/photos/joint-events/${fileName(p)} doesn't match any joint event, so it isn't shown.`, "Name the poster exactly like the event in joint-events.txt, e.g. Alumni Talk.jpg");
  }
}

/* ── Photos ────────────────────────────────────────────────────────────── */

/** Homepage slideshow. Sample slides are dropped as soon as one real photo is added. */
export const heroSlides = (() => {
  const keys = Object.keys(hero.large).sort(byPath);
  const real = keys.filter((p) => !isSample(p));
  return (real.length ? real : keys).map((p) => {
    const { src, width, height } = hero.large[p];
    return {
      src,
      small: hero.small[p],
      caption: titleCase(nameParts(fileName(p)).join(" – ")),
      // A square or upright image (a poster, a ranking, an anniversary graphic) is shown whole,
      // not cropped like a wide photo.
      graphic: width < height * 1.15,
      ratio: width / height,
    };
  });
})();

export const sitePhoto = (name: string) => findByName(photos.site, "/content/photos/site/", name);

/** "Delphique icon.png", "favicon.png": the browser-tab icon (made at build time), never the logo itself. */
const ICON = /(^|-)(icon|favicon|mark|symbol)(-|$)/;

/** Logos: any file in content/logos whose name mentions Delphique / MDI ("Delphique Logo.png"). */
export const logo = (() => {
  const files = inFolder(logos, "/content/logos/");
  const find = (test: (n: string) => boolean, label: string) => {
    // The site is dark, so a white/light version wins over a black/dark one.
    const score = (p: string) => (/white|light|inverse|negative|reverse/i.test(fileName(p)) ? 0 : /black|dark/i.test(fileName(p)) ? 2 : 1);
    const list = files.filter((p) => test(slug(stripExt(fileName(p))))).sort((a, b) => score(a) - score(b) || fileName(a).length - fileName(b).length);
    if (list.length > 1) note(`content/logos has ${list.length} ${label} logos; "${fileName(list[0])}" is used.`, `Delete the ones you don't want. On the dark website, a white or light logo works best.`);
    return list[0] ? logos[list[0]] : undefined;
  };
  return {
    delphique: find((n) => n.includes("delphique") && !ICON.test(n), "Delphique"),
    mdi: find((n) => /(^|-)mdi(-|$)/.test(n) && !n.includes("delphique") && !ICON.test(n), "MDI"),
  };
})();

export const partners = Object.keys(logos)
  .filter((p) => p.startsWith("/content/logos/partners/"))
  .sort(byPath)
  .map((p) => ({ name: nameParts(fileName(p))[0] ?? "", src: logos[p] }));

export type Photo = { thumb: string; full: string; width: number; height: number; album: string; albumId: string };
export type Album = { id: string; title: string; year: string; photos: Photo[] };

/** Albums from content/photos/gallery/<album>/, newest first. Sample albums hide once a real one exists. */
export const albums: Album[] = (() => {
  const grouped = new Map<string, string[]>();
  for (const p of Object.keys(photos.galleryThumbs).sort(byPath)) {
    if (!photos.galleryFull[p]) continue;
    // A photo's album is its folder path inside gallery/ ("Delphique 2025 Photos/Day 1").
    const rel = p.slice("/content/photos/gallery/".length).split("/").slice(0, -1);
    const folder = rel.length ? rel.join(" – ") : "Photos";
    if (!grouped.has(folder)) grouped.set(folder, []);
    grouped.get(folder)!.push(p);
  }
  const sampleAlbum = (f: string) => /(^|\b)sample\b/i.test(f);
  const entries = [...grouped.entries()];
  const real = entries.filter(([f]) => !sampleAlbum(f));
  const yearOf = (f: string) => f.match(/(?:^|\D)((?:19|20)\d{2})(?!\d)/)?.[1] ?? "";
  return (real.length ? real : entries)
    .sort(([a], [b]) => (yearOf(b) || "0").localeCompare(yearOf(a) || "0") || byPath(b, a))
    .map(([folder, paths]) => {
      const y = yearOf(folder);
      // "2026 - Finals" / "2026-12 - Finals" -> "Finals"; a year elsewhere in the name stays in the title
      const title = folder.replace(/^\s*(?:19|20)\d{2}(?:[-./]\d{1,2})?\s*[-–—:]?\s*/, "").trim() || folder;
      const id = slug(folder);
      return {
        id,
        title,
        year: y,
        photos: paths.map((p) => ({
          thumb: photos.galleryThumbs[p].src,
          width: photos.galleryThumbs[p].width,
          height: photos.galleryThumbs[p].height,
          full: photos.galleryFull[p],
          album: title,
          albumId: id,
        })),
      };
    });
})();

export const allPhotos = albums.flatMap((a) => a.photos);

export type YearGroup = { year: string; albums: Album[]; photoCount: number };

/** Albums grouped by year, newest year first. */
export const galleryYears: YearGroup[] = (() => {
  const byYear = new Map<string, Album[]>();
  for (const a of albums) {
    const key = a.year || "Other";
    if (!byYear.has(key)) byYear.set(key, []);
    byYear.get(key)!.push(a);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => (a === "Other" ? 1 : b === "Other" ? -1 : Number(b) - Number(a)))
    .map(([y, list]) => ({ year: y, albums: list, photoCount: list.reduce((n, a) => n + a.photos.length, 0) }));
})();

/** A varied handful for the homepage: takes photos round-robin across albums. */
export function previewPhotos(count: number): Photo[] {
  const out: Photo[] = [];
  for (let i = 0; out.length < count; i++) {
    let added = false;
    for (const a of albums) {
      if (a.photos[i] && out.length < count) {
        out.push(a.photos[i]);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

export type Person = { name: string; role: string; photo: string; linkedin?: string };
/** `website`: the Web Committee's group, shown on the Team page but not in the homepage strip. */
export type Group = { title: string; member: string; website: boolean; people: Person[] };

/** Keeps one file per name ("x.jpg" and "x.jpg.jpg" are the same person). */
const dedupe = (paths: string[]) => {
  const seen = new Set<string>();
  return paths.filter((p) => {
    const k = `${folderName(p)}/${slug(stripExt(fileName(p)))}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const personFrom = (map: Record<string, string>) => (p: string): Person => {
  const [name = "", ...role] = nameParts(fileName(p));
  return { name, role: role.join(" – "), photo: map[p] };
};

/**
 * Team groups from content/photos/team/<group>/<photo>. Numbered groups first, in
 * number order; the Web Committee's website team always comes last. In each group,
 * sample photos disappear as soon as one real photo is added.
 */
export const team: Group[] = (() => {
  const grouped = new Map<string, string[]>();
  for (const p of Object.keys(photos.team).sort(byPath)) {
    const group = p.slice("/content/photos/team/".length).includes("/") ? folderName(p) : "Team";
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(p);
  }
  const rank = (g: string) => (/website team|web committee/i.test(g) ? 2 : /^\s*\d/.test(g) ? 0 : 1);
  const entries = [...grouped.entries()].sort(([a], [b]) => rank(a) - rank(b) || byPath(a, b));
  // Once any real team photo exists, groups that still only hold samples are hidden.
  const anyReal = entries.some(([, paths]) => paths.some((p) => !isSample(p)));
  return entries
    .map(([group, paths]) => {
      const real = dedupe(paths.filter((p) => !isSample(p)));
      // The Web Committee's group keeps its placeholders until they add their own photos.
      const keepSamples = !anyReal || rank(group) === 2;
      const title = titleCase(group.replace(/^\s*\d{1,3}\s*[-–—._)]?\s*/, "").trim() || group);
      return {
        title,
        // "Senior Members" -> "Senior Member": shown under a name in the homepage strip when there's no position.
        member: title.replace(/\s*\(.*\)\s*$/, "").replace(/(member|organiser|organizer|coordinator|volunteer|head|lead)s$/i, "$1"),
        website: rank(group) === 2,
        people: (real.length ? real : keepSamples ? paths : []).map(personFrom(photos.team)).map((person) => ({ ...person, linkedin: linkedInFor(person.name) })),
      };
    })
    .filter((g) => g.people.length);
})();

{
  const names = new Set([...team.flatMap((g) => g.people.map((p) => slug(p.name))), ...contactPeople.map((c) => slug(c.name))]);
  for (const [key, { name }] of teamLinks) {
    if (!names.has(key)) note(`team.txt: "${name}" doesn't match any team photo, so their LinkedIn isn't shown.`, "Spell the name exactly as in their photo's file name (or add their photo to content/photos/team).");
  }
}

for (const g of team) {
  for (const person of g.people) {
    if (!person.role && /\S\s+\S+-[A-Z]/.test(person.name)) {
      note(`Team photo "${person.name}" may have the position stuck to the name.`, "Use space-dash-space:  01 - Aditi Rao - Event Management.jpg");
    }
  }
}

export type Speaker = Person & { year: number };

/**
 * Speakers, from content/photos/speakers/<year folder>/<photo>, e.g. "2025 - Delphique 29th edition".
 * Nothing ever has to be removed: this edition's speakers are "upcoming" until the event's last day,
 * then join the past speakers by themselves. A photo outside a year folder counts as this edition's.
 */
const thisEdition = eventYear ?? year;
const allSpeakers: Speaker[] = (() => {
  const keys = Object.keys(photos.speakers).sort(byPath);
  const real = dedupe(keys.filter((p) => !isSample(p)));
  return (real.length ? real : keys).map((p) => {
    const rel = p.slice("/content/photos/speakers/".length);
    const folder = rel.includes("/") ? rel.split("/")[0] : "";
    const y = Number(folder.match(/(?:^|\D)((?:19|20)\d{2})(?!\d)/)?.[1] ?? 0);
    const sp = { ...personFrom(photos.speakers)(p), year: y || thisEdition };
    if (!sp.role) note(`Speaker "${sp.name}" has no designation.`, "Name the photo like  01 - Priya Nair - CEO, Acme Ltd.jpg");
    if (!y)
      note(
        `content/photos/speakers/${rel} isn't in a folder with a year, so it's shown as a ${thisEdition} speaker.`,
        `Put it in a folder named like  ${thisEdition} - Delphique  so it moves to Past speakers by itself after the event.`,
      );
    return sp;
  });
})();
const isUpcoming = (sp: Speaker) => sp.year > thisEdition || (sp.year === thisEdition && !eventOver);
/** This edition's (and any later) speakers, in file order. */
export const speakers: Speaker[] = allSpeakers.filter(isUpcoming);
/** Everyone who has spoken before: newest year first, then in file order. */
export const pastSpeakers: Speaker[] = allSpeakers.filter((sp) => !isUpcoming(sp)).sort((a, b) => b.year - a.year);

// Text files that were renamed so badly they couldn't be recognised
for (const p of Object.keys(textFiles)) {
  if (!["links", "site", "events", "joint-events", "team"].includes(textFileKey(fileName(p)))) {
    note(`content/${fileName(p)} isn't one of the website's files, so it was ignored.`, "The website only reads links.txt, site.txt, events.txt, joint-events.txt and team.txt. Put your text in one of those.");
  }
}
