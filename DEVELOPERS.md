# Technical notes (web committee)

Website for Delphique, the National Management Convention of MDI Gurgaon.
Updating content? You don't need this file. See [`README.md`](README.md).

## How it's built

- React + Vite, styled with Tailwind CSS. Fonts are bundled (no Google Fonts request).
- Four pages: `/` (home), `/about`, `/gallery`, `/team`. The extra pages load only when visited.
- **All content is in `/content`.** `src/content.ts` reads the `.txt` files and photo folders at build time. No page hard-codes text, links or images.
- **Year and edition are computed in the browser** from today's date (Asia/Kolkata): edition = year − `first_edition` + 1, with `first_edition = 1997` in `site.txt` (verified: 2016 = 20th, 2022 = 26th, 2025 = 29th). `{year}`, `{edition}`, `{years}` and `{years-in-words}` are replaced in all `site.txt` and `events.txt` text. `year = 2026` pins it. `index.html` deliberately has no year in it, so link previews never go stale.
- **Joint events** (`content/joint-events.txt`, one `event = Name | With | Date | Link` line each) render in a searchable strip under Flagship Events (`src/components/JointEvents.tsx`). Dates are parsed in `src/dates.ts` (single days and ranges); an event is hidden in the browser after the end of its last day, so old lines never need removing. Posters are matched to event names by slug.
- The team strip and the joint-events strip share `src/components/Carousel.tsx`: auto-scroll (paused for 3.5 s after any interaction), arrows, a range slider, swipe, mouse drag (with click suppression after a drag) and arrow keys; it loops by rendering three copies when the cards overflow.
- **Forgiving content.** `src/content.ts` accepts editor mistakes instead of failing: key aliases and any capitalisation (`Countdown To:`), `Key: value`, values that wrap onto the next line, quotes, text around links, `@handles`, several phone numbers, Indian date formats and ranges (`src/dates.ts`), `photo.jpg.jpg`, `Name-Role, Company`, repeated settings (last one wins), forgotten `[id]` lines in events.txt, `closed` / `none` registration states. Anything it ignores is listed on the hidden **`/check`** page (`src/pages/Check.tsx`), which the Delphique guide points to.
- **After the event** (last day in `dates` passed) the dates/countdown hide and Register buttons show "closed" (same year) or "open soon" (new year), so stale forms never stay up.
- **Samples.** Placeholder files are named `SAMPLE - …`. A real file always wins over a sample; sample-only hero/speakers/team groups hide as soon as any real one exists.
- **Build safety nets** (`build/content-plugins.ts`): an unreadable photo is skipped with a warning instead of failing the build; HEIC (even renamed to .jpg), JFIF, AVIF, TIFF, BMP and GIF are converted to JPG first (`heic-convert`, `sharp`); the build *fails on purpose* only if `links.txt`, `site.txt` or `events.txt` is missing, so the last good deploy stays live.
- **Publishing** (`.github/workflows/publish.yml`): on every push to `main` it (1) runs `scripts/tidy_photos.py`, which converts HEIC etc. to JPG, fixes rotation and shrinks anything over 2500 px, and commits the result back; (2) builds; (3) deploys to GitHub Pages. Resized photos are cached between runs (`node_modules/.cache`, keyed on file contents). The bot's commit doesn't trigger another run. Don't add branch protection that blocks the Actions bot from pushing to `main`.
- **Direct page links:** the build copies `index.html` to `about/`, `gallery/`, `team/`, `check/` and `404.html`, because static hosts have no app fallback. `BASE_PATH` (set by the workflow) handles the `/<repo>/` sub-path before the custom domain is connected.
- Photos are resized and converted to WebP during the build by `vite-imagetools`, so the team can upload full-size photos. Grids load small thumbnails; the full image loads only in the photo viewer.

```
content/            ← everything the Delphique team edits
  links.txt           registration forms, socials, contact, brochure
  site.txt            edition, dates, headline, stats, About text
  events.txt          flagship events
  photos/             hero, events, gallery albums, team groups, speakers, fixed site photos
  logos/              Delphique, MDI, event and partner logos
  downloads/          PDFs
public/             favicon, robots.txt, cache headers (used only on Cloudflare)
build/              build-time safety nets (photo conversion, page copies, missing-file guard)
scripts/            tidy_photos.py, run by the publish workflow
.github/workflows/  publish.yml: tidy photos, build, publish
src/
  content.ts          turns /content into data
  components/         layout (nav, footer), photo viewer, countdown, buttons
  pages/              Home, About, Gallery, Team
```

## Run it locally

Needs Node 20 or newer.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the production build
```

## Who owns what

| Thing | Owner | Notes |
|---|---|---|
| GitHub organisation + repository | **Web Committee** | Hosting (GitHub Pages) runs from here too |
| Domain `mdi-delphique.com` | **Delphique** (GoDaddy) | Stays at GoDaddy; only 5 DNS records point it at GitHub |
| Everything in `/content` | **Delphique** | Edited directly on github.com |
| Code, footer credit, `Website team` photos | **Web Committee** | The credit line lives in `src/components/Layout.tsx`, not in `/content` |

### Giving Delphique edit access

Use a GitHub **organisation** for the Web Committee (free), not someone's personal account:
roles can be limited, and access survives when people graduate.

1. In the organisation: **Teams → New team** → `delphique-editors`.
2. In the repository: **Settings → Collaborators and teams → Add teams** → `delphique-editors` → role **Write**.
3. **People → Invite member** → each Delphique member's GitHub username or email (must be verified on their account) → add to the team. Invites expire after 7 days.

**Write** lets them edit and commit files, but not change settings, add people, or delete or transfer the repository.
Only Web Committee admins can do those. Every commit shows who made it, under **History**.

## Hosting on GitHub Pages

On the free plan, GitHub Pages needs the repository to be **public**. Nothing in it is secret:
everything in `/content` is shown on the website anyway.

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Actions → Publish website → Run workflow** (or push any change). After 2–3 minutes the site is at
   `https://webcommittee-mdi.github.io/dpqwebsite/`.
3. **Custom domain** (do this before touching DNS): **Settings → Pages → Custom domain** → `mdi-delphique.com` → Save.
4. **At GoDaddy** (Delphique's login) → the domain → **DNS**:
   - delete the existing `A` record for `@` (GoDaddy's parking page) and turn off any domain forwarding;
   - add four `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`;
   - set `www` to a `CNAME` pointing to `webcommittee-mdi.github.io` (no repository name);
   - leave `MX` / email records alone.
5. **Run the workflow once more** (**Actions → Publish website → Run workflow**): the site was built for the
   `/dpqwebsite/` address, and this rebuild switches it to the domain. Visitors only ever see `mdi-delphique.com`;
   the old `github.io` address then redirects to it.
6. Back in **Settings → Pages**, tick **Enforce HTTPS** once it becomes available (DNS can take up to 24 hours).
7. Recommended: verify the domain for the organisation (**Organisation settings → Pages → Add a domain**, one `TXT`
   record at GoDaddy) so no one else can claim it on GitHub.

Limits to know: a published site may be up to 1 GB and has a soft limit of 100 GB of traffic a month, far
more than this site needs, since photos are resized to WebP during the build.

### Alternative: Cloudflare Pages

Set a repository variable `HOSTING = cloudflare` (**Settings → Secrets and variables → Actions → Variables**) so the
workflow only tidies photos. Then, in Cloudflare: **Workers & Pages → Create application → Pages → Connect to Git**,
build command `npm run build`, output `dist`. Domain: change the GoDaddy nameservers to Cloudflare's (copy MX records
first) and add both domains under the project's **Custom domains**.

## Handover

Keep the GitHub organisation on a Web Committee email, not a personal one, with at least two owners.
Delphique keeps the GoDaddy login and should turn on auto-renew for the domain.
