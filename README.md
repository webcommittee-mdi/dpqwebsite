# How to update the Delphique website

**Where:** the website lives on the Web Committee's GitHub → https://github.com/webcommittee-mdi/dpqwebsite
Use **Chrome on a laptop**. Text changes also work in a phone's browser (not the GitHub app).

Everything you'll ever change is inside the **content** folder.
You change something, press **Commit changes** (that means *Save*), wait 3 minutes, and it's live.

> **First time?** Send your GitHub username to the web committee. You'll get an email invite:
> accept it within 7 days. If you see **Propose changes** or **Fork** instead of **Commit changes**,
> you don't have access yet.

⚠️ **Everything you upload is public**, and stays visible in the history even after you delete it.
Don't upload anything private (phone lists, ID cards, unreleased results).

**Who looks after what:** Delphique changes the **content** folder (except the "Website team" photos).
The Web Committee looks after everything else: the code, the hosting and the website team.

---

## The 3 things you'll do

**Change text**
1. Open **content**, then the file (for example **links.txt**).
2. Click the ✏️ pencil (top right).
3. Change the words **after** the `=` sign. Leave the word before it alone.
   Notes for yourself must start with `#`.
4. Click the green **Commit changes**, then **Commit changes** again. Keep *"Commit directly to the main branch"* ticked.

**Add photos**
1. Open the folder (for example **content → photos → gallery**).
2. Click **Add file → Upload files**.
3. Drag the photos in. You can drag a whole folder too: it stays a folder. (Up to 100 files at a time.)
4. Click **Commit changes**.

**Delete something**
1. Open the file or folder.
2. Click the **⋯** (three dots, top right) → **Delete file** or **Delete directory** (= folder).
3. Click **Commit changes**, then **Commit changes** again.

⚠️ Never delete **links.txt**, **site.txt** or **events.txt**. If one goes missing, the website stops updating
(the last good version stays live) until the file is back.

---

## I want to…

| I want to… | Open | Do this |
|---|---|---|
| Open registrations | links.txt | `register =` is the Register button at the top of every page. Paste the form link after it. |
| Give one event its own form | links.txt | `register_cerebro =` is the button on Cerebro's card. Paste its link there. |
| Close registrations | links.txt | Write `closed` instead of the link. The button says "Registrations closed". |
| An event with no sign-ups (a show) | links.txt | Write `none`. Its card has no button. |
| Show the dates | site.txt | `dates = 4–5 December 2026`, with the year. Then open **/check** and see that *Event dates* shows the right days. |
| Start the countdown | nothing | It starts by itself from `dates`, and stops on the day. |
| Show news at the top | site.txt | Write it after `announcement =`. Delete it to hide. |
| Change the big numbers | site.txt | Edit the `stat =` lines: `1500+ \| Attendees every year` |
| Add Instagram, LinkedIn, email, phone | links.txt | Fill in that line. Instagram/YouTube: link or `@handle`. LinkedIn: the full link. |
| Add gallery photos | photos → gallery | See "Name things like this" below |
| Change the team | photos → team | Delete last year's Core and Junior folders, upload the new ones. Leave "Website team" as it is |
| Add a speaker | photos → speakers | Upload their photo. The section appears by itself |
| Add a sponsor | logos → partners | Upload their logo. The section appears by itself |
| Add or remove an event | events.txt | See the event checklist below |
| Add a joint event (with another club) | joint-events.txt | Add one line: `event = Name \| Club \| Date \| Link` |
| Remove a joint event | nothing | It disappears by itself the day after its date |
| Replace the brochure | downloads + links.txt | Upload the PDF, then write its name after `brochure =` |
| Anything else | slideshow → photos → hero · our logos → logos | Read the **HOW-TO.txt** inside that folder |
| Change the year or edition | nothing | It changes by itself every 1 January |

After the event's last day, the dates and countdown hide themselves and Register buttons say
"Registrations closed" (then "Registrations open soon" from 1 January), so last year's forms never stay up.

---

## Name things like this

The website reads names, positions and order **from the file name**.

| What | Name it | Website shows |
|---|---|---|
| Team photo | `01 - Aarav Sharma - Secretary.jpg` | Aarav Sharma, Secretary, 1st |
| Team photo, no position | `01 - Aarav Sharma.jpg` | Aarav Sharma |
| Team folder | `1 - Core team` | "Core team", first group |
| Gallery folder | `2026 - Cerebro finals` | "Cerebro finals" under 2026 |
| Photos in a gallery folder | anything (`IMG_2201.jpg` is fine) | in name order |
| Speaker photo | `01 - Priya Nair - CEO, Acme Ltd.jpg` | Priya Nair, CEO, Acme Ltd |
| Sponsor logo | `01 - Paytm.png` | 1st sponsor |
| Event photo | `cerebro.jpg` | must match the event's short ID |
| Joint event poster | `Alumni Talk.jpg` | must match the joint event's name |

- Put **space, dash, space** between parts: ` - `
- The number only sets the order. It isn't shown.
- Rename files **on your laptop before uploading** (right-click → Rename).
- To make a new folder: make it on your laptop with the right name, put the photos in, then drag the whole folder into **Upload files**.
- Spelling mistake? Delete that photo, rename it on your laptop, upload it again.

---

## Photos: the 3 rules

1. **Straight from a phone or camera is perfect**, iPhone photos included. Don't crop, shrink or convert anything: the website does it.
2. **People:** upright photo, head and shoulders, face in the top half, plain background.
   **Events and slideshow:** wide photo, action in the middle.
3. **Don't send photos through WhatsApp.** It makes them blurry. Use Google Drive or a cable.
   Google Drive gives several photos as a `.zip`: unzip it on your laptop first, then upload the photos.

Pick your best 30–50 photos per album. The gallery is for highlights. GitHub takes files up to 25 MB.

The sample photos (named `SAMPLE - …`) hide themselves as soon as you upload a real one.
Delete them whenever you like, except in the Website team folder.

---

## Have this ready before you add…

**A new event**
- Its name, and a short ID: small letters, dashes for spaces → `comedy-night`
- A one-line category ("Comedy show") and a one-line tagline
- 1–3 numbers, e.g. prize money, registrations
- 2–4 short bullet points
- A wide photo, renamed `comedy-night.jpg`
- The registration form link (or `none` if it has no sign-ups)

Then:
1. In **events.txt**, copy a whole event, **including** its `[cerebro]` line, down to its last `point =` line. Paste it at the very end.
2. Change `[cerebro]` to `[comedy-night]`, and the words after each `=`.
   Numbers are written `number | label`. The `|` key is Shift + \ . Delete number lines you don't need.
3. Upload `comedy-night.jpg` to **photos → events** (optional logo to **logos → events**).
4. In **links.txt**, add a new line: `register_comedy-night = https://...` (or `= none`).

To remove an event, delete its whole block, **including** its `[name]` line, and its `register_…` line in links.txt.

**A joint event** (with another club, committee or SIG): its name, the club's name, the date, and optionally the form link and the Instagram poster.

```
event = Alumni Talk | Alumni Committee | 14 November 2026 | https://forms.gle/...
```
Poster goes in **photos → joint-events**, named like the event: `Alumni Talk.jpg`.
For more than one day, write the date like `20–22 November 2026`.

**A team member:** photo (upright), full name, position, and which group they're in.

**A gallery album:** the year, a short album name, and the photos.

**A speaker:** photo (upright), full name, designation and company.

**A sponsor:** their logo file and company name. Any logo works: it goes on a white tile.

---

## Every new year

- [ ] site.txt: new `dates`, and the `stat =` numbers
- [ ] links.txt: the new registration forms (and `join_team` when recruiting)
- [ ] events.txt: this year's prizes, registration numbers and bullet points
- [ ] photos → team: delete last year's Core and Junior folders, upload the new team (leave "Website team")
- [ ] photos → speakers and logos → partners: replace last year's
- [ ] photos → hero: this year's slideshow photos
- [ ] photos → gallery: add last year's event as a new album
- [ ] downloads + links.txt: the new brochure
- [ ] joint-events.txt: add this year's joint events (old ones hide themselves)

The year, the edition (30th, 31st…) and "Thirty years" update themselves.

---

## Something wrong?

- **Open mdi-delphique.com/check.** It lists anything the website couldn't understand (a mistyped line,
  a photo it couldn't read, a name that doesn't match) and says what to fix.
- **Nothing changed?** Wait 3 minutes, then refresh. On GitHub, a yellow dot next to your change means it's
  still publishing; a red ✗ means the website didn't update. Undo your last change, or ask the web committee.
- **Undo a text change:** open the file → **History** (clock icon) → click your change. Red = what was there before. Click ✏️, type it back, Commit.
- **Deleted a photo by mistake?** Upload it again.
- **Deleted a whole text file?** The website keeps showing the last good version. Don't make a new copy
  (like `site (1).txt`): ask the web committee to restore it.
- **Anything else:** message the web committee with what you changed and when. Nothing is ever lost; they can restore it.

*Web committee: technical notes are in [DEVELOPERS.md](DEVELOPERS.md).*
