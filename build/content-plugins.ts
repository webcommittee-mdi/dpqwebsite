/**
 * Build-time safety nets for files the Delphique team uploads to /content.
 *
 *  - contentGuard:   stops the build (so the last good site stays live) only when one of
 *                    the three core text files is missing. Everything else is forgiven.
 *  - photoConverter: turns iPhone HEIC photos (even ones renamed to .jpg) and other
 *                    unusual formats (JFIF, AVIF, TIFF, BMP, GIF) into JPGs before resizing.
 *  - forgiving():    wraps the image plugin so a broken or empty photo is skipped with a
 *                    warning instead of failing the whole build.
 *  - favicons:       turns "Delphique icon.png" in content/logos into the browser-tab and
 *                    home-screen icons (falls back to public/favicon.svg without one).
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, openSync, readSync, closeSync, statSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import sharp from "sharp";

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, "node_modules/.cache/content-photos");
const SKIPPED = "\0skipped-photo:";

/** "Site (1).TXT", "site.txt.txt", "site copy.txt" -> "site" */
export const textFileKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/(\.txt)+$/i, "")
    .replace(/\s*\(\d+\)$|\s*[-_ ]copy$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function contentGuard(): Plugin {
  return {
    name: "delphique-content-guard",
    buildStart() {
      const dir = path.join(ROOT, "content");
      const present = existsSync(dir) ? readdirSync(dir).filter((f) => /\.txt$/i.test(f)).map(textFileKey) : [];
      const missing = ["links", "site", "events"].filter((k) => !present.includes(k));
      if (missing.length) {
        this.error(
          `content/${missing[0]}.txt is missing, so the website was NOT updated (the last good version stays live). ` +
            `Ask the web committee to restore it.`,
        );
      }
    },
  };
}

const NATIVE = /\.(jpe?g|png|webp)$/i;
const CONVERTIBLE = /\.(heic|heif|jfif|avif|tiff?|bmp|gif)$/i;

function isHeif(file: string) {
  try {
    const fd = openSync(file, "r");
    const buf = Buffer.alloc(12);
    readSync(fd, buf, 0, 12, 0);
    closeSync(fd);
    return buf.toString("latin1", 4, 8) === "ftyp" && /^(heic|heix|hevc|heim|heis|mif1|msf1)$/.test(buf.toString("latin1", 8, 12));
  } catch {
    return false;
  }
}

async function toJpeg(file: string): Promise<string | null> {
  const st = statSync(file);
  const out = path.join(CACHE, createHash("sha1").update(`${file}:${st.size}:${st.mtimeMs}`).digest("hex") + ".jpg");
  if (existsSync(out)) return out;
  mkdirSync(CACHE, { recursive: true });
  try {
    if (isHeif(file)) {
      const convert = (await import("heic-convert")).default;
      const jpg = await convert({ buffer: readFileSync(file), format: "JPEG", quality: 0.9 });
      writeFileSync(out, Buffer.from(jpg));
    } else {
      await sharp(file, { animated: false }).rotate().jpeg({ quality: 90 }).toFile(out);
    }
    return out;
  } catch {
    return null;
  }
}

/** A list of every file in /content, so the site can point out files it can't use. */
export function contentListing(): Plugin {
  const ID = "virtual:content-files";
  const walk = (dir: string, base = ""): string[] =>
    existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory() ? walk(path.join(dir, e.name), `${base}${e.name}/`) : [`${base}${e.name}`],
        )
      : [];
  return {
    name: "delphique-content-listing",
    resolveId: (id) => (id === ID ? `\0${ID}` : null),
    load: (id) => (id === `\0${ID}` ? `export default ${JSON.stringify(walk(path.join(ROOT, "content")))};` : null),
  };
}

/** Copies a photo whose name trips up the build (%, #, ?) to a safely named cache file. */
function safeCopy(file: string) {
  const st = statSync(file);
  const out = path.join(CACHE, createHash("sha1").update(`${file}:${st.size}:${st.mtimeMs}`).digest("hex") + path.extname(file).toLowerCase());
  mkdirSync(CACHE, { recursive: true });
  if (!existsSync(out)) copyFileSync(file, out);
  return out;
}

export function photoConverter(): Plugin {
  const done = new Map<string, Promise<string | null>>();
  return {
    name: "delphique-photo-converter",
    enforce: "pre",
    async resolveId(source, importer) {
      // Split off the "?w=…" query, but not a "?" inside a file name.
      const q = source.search(/\?(w|as|format|url|raw)=?/);
      const file = q >= 0 ? source.slice(0, q) : source;
      const query = q >= 0 ? source.slice(q + 1) : "";
      // Globs arrive as "/content/…" or relative to the importing file ("../content/…").
      let rel = file;
      try {
        rel = decodeURIComponent(file);
      } catch {
        /* a "%" in the file name: use it as it is */
      }
      const abs = rel.startsWith("/content/") ? path.join(ROOT, rel) : importer ? path.resolve(path.dirname(importer), rel) : "";
      if (!abs.startsWith(path.join(ROOT, "content") + path.sep)) return null;
      if (!existsSync(abs)) return null;
      const needs = CONVERTIBLE.test(file) || (NATIVE.test(file) && /\.jpe?g$/i.test(file) && isHeif(abs));
      if (!needs) return /[%#?]/.test(path.basename(abs)) && NATIVE.test(abs) ? safeCopy(abs) + (query ? `?${query}` : "") : null;
      if (!done.has(abs)) done.set(abs, toJpeg(abs));
      const out = await done.get(abs)!;
      if (!out) {
        this.warn(`Skipped ${path.relative(ROOT, abs)}: it could not be converted to a normal photo.`);
        return SKIPPED + abs;
      }
      return out + (query ? `?${query}` : "");
    },
    load(id) {
      if (id.startsWith(SKIPPED)) return "export default null;";
      return null;
    },
  };
}

/** Wraps the image plugin so one bad photo is skipped instead of failing the build. */
export function forgiving(plugin: Plugin): Plugin {
  const load = plugin.load as (this: unknown, id: string) => Promise<unknown>;
  return {
    ...plugin,
    async load(id: string) {
      try {
        return await load.call(this, id);
      } catch (e) {
        (this as { warn: (m: string) => void }).warn(`Skipped ${id.split("?")[0].replace(ROOT, "")}: ${(e as Error).message}`);
        return "export default null;";
      }
    },
  } as Plugin;
}

/**
 * Copies the built index.html to <page>/index.html for every page, and to 404.html,
 * so links like mdi-delphique.com/gallery open directly on static hosts.
 */
export function pageCopies(pages: string[]): Plugin {
  let outDir = "dist";
  return {
    name: "delphique-page-copies",
    apply: "build",
    configResolved(cfg) {
      outDir = path.resolve(cfg.root, cfg.build.outDir);
    },
    closeBundle() {
      const html = path.join(outDir, "index.html");
      if (!existsSync(html)) return;
      for (const page of pages) {
        mkdirSync(path.join(outDir, page), { recursive: true });
        copyFileSync(html, path.join(outDir, page, "index.html"));
      }
      copyFileSync(html, path.join(outDir, "404.html"));
    },
  };
}

/**
 * Browser-tab and phone home-screen icons from content/logos/"... icon.png" (or favicon/mark/symbol).
 * The icon is trimmed, centred on a tile and saved at the sizes browsers ask for. The tile is white,
 * or near-black when the file name says white/light (a logo made for dark backgrounds).
 */
export function favicons(): Plugin {
  let base = "/";
  let files: { fileName: string; source: Buffer }[] = [];
  const ICON = /(^|[^a-z])(icon|favicon|mark|symbol)([^a-z]|$)/i;
  return {
    name: "delphique-favicons",
    apply: "build",
    configResolved(cfg) {
      base = cfg.base;
    },
    async buildStart() {
      files = [];
      const dir = path.join(ROOT, "content/logos");
      if (!existsSync(dir)) return;
      const icon = readdirSync(dir)
        .filter((n) => /\.(png|webp|jpe?g|svg)$/i.test(n) && ICON.test(n.replace(/\.[^.]+$/, "")))
        .sort((a, b) => Number(!/delphique/i.test(a)) - Number(!/delphique/i.test(b)) || a.length - b.length)[0];
      if (!icon) return;
      try {
        const dark = /white|light|inverse|negative|reverse/i.test(icon);
        const bg = dark ? "#050505" : "#ffffff";
        const mark = await sharp(path.join(dir, icon), { density: 300 }).trim().png().toBuffer();
        // Browser tabs: the icon on its own, no tile behind it (transparent PNG).
        const bare = async (size: number, pad: number) => {
          const inner = Math.round(size * (1 - 2 * pad));
          const fitted = await sharp(mark).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
          return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
            .composite([{ input: fitted, gravity: "center" }])
            .png()
            .toBuffer();
        };
        // Phone home screens need a solid square: iOS turns transparent corners black.
        const tile = async (size: number, pad: number) => {
          const inner = Math.round(size * (1 - 2 * pad));
          const fitted = await sharp(mark).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
          const shape = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}"/></svg>`);
          return sharp(shape).composite([{ input: fitted, gravity: "center" }]).png().toBuffer();
        };
        files = [
          { fileName: "favicon-32.png", source: await bare(32, 0) },
          { fileName: "favicon-192.png", source: await bare(192, 0.03) },
          { fileName: "apple-touch-icon.png", source: await tile(180, 0.12) },
        ];
      } catch (e) {
        files = [];
        this.warn(`content/logos/${icon} couldn't be made into the browser-tab icon (${(e as Error).message}); keeping the default one.`);
      }
    },
    generateBundle() {
      for (const f of files) this.emitFile({ type: "asset", fileName: f.fileName, source: f.source });
    },
    transformIndexHtml(html) {
      if (!files.length) return html;
      return html.replace(
        /<link rel="icon"[^>]*>/,
        `<link rel="icon" type="image/png" sizes="32x32" href="${base}favicon-32.png" />\n` +
          `    <link rel="icon" type="image/png" sizes="192x192" href="${base}favicon-192.png" />\n` +
          `    <link rel="apple-touch-icon" href="${base}apple-touch-icon.png" />`,
      );
    },
  };
}
