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
- **Build safety nets** (`build/content-plugins.ts`): an unreadable photo is skipped with a warning instead of failing the build; HEIC (even renamed to .jpg), JFIF, AVIF, TIFF, BMP and GIF are converted to JPG first (`heic-convert`, `sharp`); the build *fails on purpose* only if `links.txt`, `site.txt` or `events.txt` is missing, so the last good deploy stays live. The browser-tab and home-screen icons are made from `content/logos/Delphique icon.png` by the `favicons` plugin (any file with icon/favicon/mark/symbol in its name; `public/favicon.svg` is the fallback).
- **Publishing** (`.github/workflows/publish.yml`): on every push to `main` it (1) runs `scripts/tidy_photos.py`, which converts HEIC etc. to JPG, fixes rotation and shrinks anything over 2500 px, and commits the result back; (2) builds; (3) deploys to GitHub Pages. Resized photos are cached between runs (`node_modules/.cache`, keyed on file contents). The bot's commit doesn't trigger another run. Don't add branch protection that blocks the Actions bot from pushing to `main`. All actions are on their Node 24 versions, and the runner is pinned to `ubuntu-24.04` (not `ubuntu-latest`) so an Ubuntu upgrade can't break publishing unannounced; bump it when GitHub announces 24.04's retirement.
- **Direct page links:** the build copies `index.html` to `about/`, `gallery/`, `team/`, `check/` and `404.html`, because static hosts have no app fallback. `BASE_PATH` (set by the workflow) handles the `/<repo>/` sub-path before the custom domain is connected.
- **Logo.** `content/logos/Delphique logo white.png` was made from Delphique's `Logo.png` by turning only the text white; every pixel of the symbol is unchanged. Logos are converted to WebP losslessly, so they look exactly like the uploaded file. Replace it with an official dark-background file when Delphique has one (keep "white" in the name).
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

Needs Node 24 (the version in `.node-version`, which the publish workflow uses too).

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the production build
```

## Who owns what

| Thing | Owner | Notes |
|---|---|---|
| GitHub account `webcommittee-mdi` + repository `dpqwebsite` | **Web Committee** | Hosting (GitHub Pages) runs from here too |
| Domain `mdi-delphique.com` | **Delphique** (GoDaddy) | Stays at GoDaddy; only 5 DNS records point it at GitHub |
| Everything in `/content` | **Delphique** | Edited directly on github.com |
| Code, footer credit, `Website team` photos | **Web Committee** | The credit line lives in `src/components/Layout.tsx`, not in `/content` |

### Giving Delphique edit access

`webcommittee-mdi` is a regular GitHub account (not an organisation), so access is given per person:

1. In the repository: **Settings → Collaborators → Add people** → each Delphique member's GitHub username
   (or the email on their GitHub account). They accept the email invite within 7 days.
2. Once, after the first push: **Settings → Rules → Rulesets → New ruleset → New branch ruleset**. Name it
   `protect main`, set **Enforcement status: Active**, **Target branches → Add target → Include default branch**,
   and tick only **Restrict deletions** and **Block force pushes** → **Create**. No one can then wipe the history.
   Don't tick "Require a pull request": it would block Delphique's direct edits and the photo-tidy bot.

Collaborators can edit and commit any file (code too), but can't add people, change visibility, or delete the
repository. Every commit shows who made it, under **History**. Remove people on the same page when they graduate.

Want roles (e.g. content-only teams) and more than one admin later? Turn the account into an organisation:
**Settings → Organizations → Turn webcommittee-mdi into an organization**. Read GitHub's "Converting a user into an
organization" first: it can't be undone, and it needs a separate personal account to become the owner.

## Hosting on GitHub Pages

On the free plan, GitHub Pages needs the repository to be **public**. Nothing in it is secret:
everything in `/content` is shown on the website anyway.

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Actions → Publish website → Run workflow** (or push any change). After 2–3 minutes the site is at
   `https://webcommittee-mdi.github.io/dpqwebsite/`.
3. **Custom domain** (do this before touching DNS): **Settings → Pages → Custom domain** → `mdi-delphique.com` → Save.
   The DNS check fails until step 5 is done; that's expected.
4. **Run the workflow once more** straight away (**Actions → Publish website → Run workflow**): the site was built for
   the `/dpqwebsite/` address, and this rebuild switches it to the domain. Skip it and the domain shows a blank page.
   From now on the `github.io` address redirects to `mdi-delphique.com`.
5. **At GoDaddy** (Delphique's login) → **Domain Portfolio** → `mdi-delphique.com` → **DNS** → **DNS Records**:
   - edit the `A` record for `@` that says **Parked**: change its value to `185.199.108.153`;
   - **Add New Record** three times: type `A`, name `@`, values `185.199.109.153`, `185.199.110.153`, `185.199.111.153`;
   - edit the `CNAME` record for `www`: change its value from `@` to `webcommittee-mdi.github.io` (no repository name);
   - optional (IPv6): four `AAAA` records for `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`;
   - turn off domain **Forwarding** if any is set, and remove any other `A` record for `@` (e.g. a GoDaddy Website Builder site);
   - leave `MX`, `TXT`, `NS`, `SOA` and `_domainconnect` records alone.

   These four IPs are GitHub's, the same for every Pages site, and have been unchanged since 2018. If GitHub ever
   announces new ones (or **Settings → Pages** shows a DNS warning), copy the current list from GitHub's guide
   "Managing a custom domain for your GitHub Pages site" into the four `A` records. The `www` record needs no change.
6. Back in **Settings → Pages**, wait for **DNS check successful** (minutes, up to 24 hours), then tick
   **Enforce HTTPS** once it becomes clickable (the certificate can take up to an hour more).
7. Recommended: verify the domain for the account (profile picture → **Settings → Pages → Add a domain**, one `TXT`
   record at GoDaddy) so no one else can claim it on GitHub.

If a run called **pages build and deployment** ever appears under Actions, **Settings → Pages → Source** has been
switched to "Deploy from a branch". Set it back to **GitHub Actions**.

Limits to know: a published site may be up to 1 GB and has a soft limit of 100 GB of traffic a month, far
more than this site needs, since photos are resized to WebP during the build.

### Alternative: Cloudflare Pages

Set a repository variable `HOSTING = cloudflare` (**Settings → Secrets and variables → Actions → Variables**) so the
workflow only tidies photos. Then, in Cloudflare: **Workers & Pages → Create application → Pages → Connect to Git**,
build command `npm run build`, output `dist`. Domain: change the GoDaddy nameservers to Cloudflare's (copy MX records
first) and add both domains under the project's **Custom domains**.

## Handover

Keep the `webcommittee-mdi` account on a Web Committee email, not a personal one. Each year, hand the next
Web Committee its password, its two-factor login (authenticator app) and its recovery codes.
Delphique keeps the GoDaddy login and should turn on auto-renew for the domain.
