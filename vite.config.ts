import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { imagetools } from "vite-imagetools";
import { contentGuard, contentListing, forgiving, pageCopies, photoConverter } from "./build/content-plugins";

// GitHub Pages serves the site from "/<repository>/" until the custom domain is connected.
// The publish workflow passes that path in BASE_PATH; locally and on the real domain it's "/".
const base = (process.env.BASE_PATH ?? "").replace(/\/+$/, "") + "/";

export default defineConfig({
  base,
  // Shown on /check, so editors can tell the page has caught up with their change.
  define: { __BUILT_AT__: JSON.stringify(new Date().toISOString()) },
  plugins: [
    contentGuard(),
    contentListing(),
    // iPhone HEIC and other unusual formats become JPGs first.
    photoConverter(),
    // Resizes and converts every photo in /content during the build.
    // Matches upper-case extensions too (phones often save .JPG). A broken photo is skipped.
    forgiving(imagetools({ include: /^[^?]+\.(avif|gif|heif|jpe?g|png|tiff|webp)\?.*$/i })),
    react(),
    tailwindcss(),
    // Lets /about, /gallery, /team and /check open directly (GitHub Pages has no app fallback).
    pageCopies(["about", "gallery", "team", "check"]),
  ],
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Clean, cache-friendly file names (photo names can contain spaces).
        assetFileNames: (info) => {
          const ext = (info.names?.[0] ?? info.name ?? "").split(".").pop();
          return `assets/[hash].${ext}`;
        },
      },
    },
  },
});
