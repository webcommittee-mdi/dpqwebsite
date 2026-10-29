import { useEffect, useState } from "react";
import { Link } from "react-router";
import { contact, events, heroSlides, link, partners, pastSpeakers, previewPhotos, site, sitePhoto, speakers, team, type Event, type Speaker } from "../content";
import { Countdown } from "../components/Countdown";
import { Lightbox } from "../components/Lightbox";
import { Carousel } from "../components/Carousel";
import { JointEvents } from "../components/JointEvents";
import { A, BrochureButton, Ordinals, RegisterButton, Rich, SectionHead, useTitle } from "../components/ui";
import { PersonCard } from "../components/PersonCard";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Hero ──────────────────────────────────────────────────────────────── */

function Hero() {
  const [slide, setSlide] = useState(0);
  const [reached, setReached] = useState(1); // only load photos once they are about to show
  const count = heroSlides.length;

  useEffect(() => {
    if (count < 2 || reducedMotion()) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % count), 6500);
    return () => clearInterval(id);
  }, [count]);
  useEffect(() => setReached((r) => Math.max(r, Math.min(count, slide + 2))), [slide, count]);

  return (
    <section className="relative overflow-hidden" aria-label="Delphique">
      {/* Photo panel: a band across the top on phones (the text sits below it, on black),
          a slanted panel on the right on wide screens. The photos stay bright; the gradients
          only fade their edges into the page so the headline never sits on a busy photo. */}
      <div className="absolute inset-x-0 top-0 h-[48svh] bg-ink lg:inset-y-0 lg:left-[44%] lg:h-auto lg:[clip-path:polygon(14%_0,100%_0,100%_100%,0_100%)]" aria-hidden="true">
        {heroSlides.map((s, i) => {
          if (i >= reached) return null;
          const common = {
            src: s.src,
            srcSet: s.small ? `${s.small} 900w, ${s.src} 1920w` : undefined,
            alt: "",
            fetchPriority: (i === 0 ? "high" : "low") as "high" | "low",
            decoding: "async" as const,
          };
          return s.graphic ? (
            // A graphic (the 30-years mark, a ranking) is shown whole and a little see-through,
            // inset from the slanted edge so nothing is cut off.
            <div
              key={s.src}
              className="absolute inset-0 px-6 pb-[16%] pt-6 transition-opacity duration-[2000ms] lg:py-[9%] lg:pl-[22%] lg:pr-[9%]"
              style={{ opacity: i === slide ? 1 : 0 }}
            >
              {/* "lighten": a graphic's own black background melts into the page instead of showing as a box. */}
              <img {...common} sizes="(min-width: 1024px) 40vw, 90vw" className="h-full w-full object-contain mix-blend-lighten" style={{ opacity: 0.88 }} />
            </div>
          ) : (
            <img
              key={s.src}
              {...common}
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms]"
              style={{ opacity: i === slide ? 1 : 0, filter: "brightness(0.82) saturate(1.05)" }}
            />
          );
        })}
        {/* The shading below is for photos; it fades away while a graphic is showing. */}
        <div className="absolute inset-0 transition-opacity duration-[2000ms]" style={{ opacity: heroSlides[slide]?.graphic ? 0 : 1 }}>
          {/* Phones: fade the bottom of the band into the page. Wide screens: fade the left edge. */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/10 lg:bg-gradient-to-r lg:from-ink lg:via-ink/25 lg:to-transparent" />
          {/* A warm, deep-red wash that ties the photos to the site's colours, and a dark foot for the slide labels. */}
          <div className="absolute inset-0 bg-gradient-to-br from-oxblood/25 via-transparent to-transparent mix-blend-multiply" />
          <div className="absolute inset-x-0 bottom-0 hidden h-1/3 bg-gradient-to-t from-ink/85 to-transparent lg:block" />
        </div>
      </div>

      <div className="wrap relative flex min-h-[calc(100svh-72px)] flex-col justify-end pb-14 pt-[40svh] lg:justify-center lg:pb-20 lg:pt-16">
        <div className="max-w-[640px]">
          <h1 className="display rise mb-8 text-[clamp(2.4rem,1.6rem+3.6vw,4.6rem)] uppercase" style={{ animationDelay: "0.25s" }}>
            {site.headline.map((line, i) => (
              <span key={i} className={`block text-balance ${i % 2 ? "text-carpet" : "text-paper"}`}>
                {line}
              </span>
            ))}
          </h1>
          <p className="rise mb-10 max-w-[46ch] text-[1.0625rem] leading-relaxed text-mute" style={{ animationDelay: "0.45s" }}>
            {site.intro}
          </p>
          <div className="rise flex flex-wrap items-center gap-4" style={{ animationDelay: "0.6s" }}>
            <RegisterButton />
            <Link to="/#events" className="btn btn-ghost">
              Explore the Events
            </Link>
          </div>
          {(site.dates || !Number.isNaN(site.countdownTo)) && (
            <div className="rise mt-12 flex flex-wrap items-end gap-x-10 gap-y-6 border-t border-line pt-6" style={{ animationDelay: "0.75s" }}>
              {site.dates && (
                <div>
                  <p className="font-display text-2xl">{site.dates}</p>
                  <p className="mt-1 text-sm text-mute">{site.venue}</p>
                </div>
              )}
              <Countdown to={site.countdownTo} />
            </div>
          )}
        </div>

        {count > 1 && (
          <div className="mt-12 flex flex-wrap items-center gap-4 lg:absolute lg:bottom-10 lg:right-16 lg:mt-0">
            {heroSlides.map((s, i) => (
              <button
                key={s.src}
                onClick={() => setSlide(i)}
                className="flex h-8 min-w-8 items-center justify-center gap-2.5"
                aria-label={`Show photo: ${s.caption || i + 1}`}
                aria-current={i === slide}
              >
                <span className={`h-px transition-all duration-500 ${i === slide ? "w-8 bg-gold" : "w-3 bg-mute/60"}`} />
                {i === slide && s.caption && (
                  <span className="text-sm text-gold">
                    <Ordinals text={s.caption} />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Stats() {
  if (!site.stats.length) return null;
  return (
    <section aria-label="Delphique in numbers" className="border-y border-line bg-stage">
      <dl className="wrap grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:grid-cols-3 lg:flex lg:justify-between lg:py-12">
        {site.stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse gap-2">
            <dt className="text-sm text-mute">{s.label}</dt>
            <dd className="font-display text-[clamp(2rem,3.6vw,3rem)] leading-none text-gold">
              <Ordinals text={s.value} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ── Events ────────────────────────────────────────────────────────────── */

/**
 * One flagship event per row: the poster (or photo) beside the text, swapping sides row by row.
 * Posters are always shown whole, never cropped, so no line of them is ever cut off.
 * A wide photo fills its half of the row instead.
 */
function EventCard({ ev, flip = false }: { ev: Event; flip?: boolean }) {
  const poster = Boolean(ev.photo && (ev.photoRatio ?? 1) < 1.05);
  const hasMedia = Boolean(ev.photo || ev.logo);
  return (
    <article className={`bg-ink md:grid md:items-stretch ${hasMedia ? (flip ? "md:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]" : "md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]") : ""}`}>
      {hasMedia && (
        <div className={`relative overflow-hidden ${flip ? "md:order-2" : ""} ${poster ? "md:flex md:items-center" : "aspect-[4/3] bg-stage md:aspect-auto md:min-h-[320px]"}`}>
          {ev.photo &&
            (poster ? (
              <img
                src={ev.photo}
                alt={`${ev.title} poster`}
                loading="lazy"
                decoding="async"
                width={1080}
                height={Math.round(1080 / (ev.photoRatio ?? 0.75))}
                className="block h-auto w-full"
              />
            ) : (
              <img src={ev.photo} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ filter: "brightness(0.85)" }} />
            ))}
          {ev.logo && (
            <div className="absolute bottom-4 left-4 bg-white px-3 py-2">
              <img src={ev.logo} alt={`${ev.title} logo`} className="h-10 w-auto max-w-[180px] object-contain" />
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:px-14 lg:py-12">
        <p className="mb-2 text-sm text-carpet">{ev.category}</p>
        <h3 className="display mb-3 text-[clamp(1.9rem,3vw,2.6rem)]">{ev.title}</h3>
        {ev.tagline && <p className="mb-6 font-display text-[1.125rem] italic leading-snug text-mute">{ev.tagline}</p>}
        {ev.stats.length > 0 && (
          <dl className="mb-6 flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-5">
            {ev.stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-mute">{s.label}</dt>
                <dd className="font-display text-[1.75rem] leading-none text-gold">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <ul className="mb-8 flex max-w-[60ch] flex-col gap-2.5">
          {ev.points.map((p) => (
            <li key={p} className="flex gap-3 text-[0.9375rem] leading-relaxed text-mute">
              <span className="mt-[0.7em] h-px w-3 shrink-0 bg-carpet" />
              {p}
            </li>
          ))}
        </ul>
        {ev.reg.state !== "none" && (
          <div>
            <RegisterButton reg={ev.reg} label={`Register for ${ev.title}`} />
          </div>
        )}
      </div>
    </article>
  );
}

function Events() {
  if (!events.length) return null;
  return (
    <section id="events" className="py-24 lg:py-36" aria-labelledby="events-title">
      <div className="wrap">
        <SectionHead id="events-title" title="Flagship Events">
          Competitions and conversations that bring students from India's leading B-schools to MDI every year.
        </SectionHead>
        {/* Phones: clear space between events, so each poster sits with its own text. Wider: hairlines. */}
        <div className="flex flex-col gap-14 md:gap-px md:bg-line">
          {events.map((ev, i) => (
            <EventCard key={ev.id} ev={ev} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── About teaser ──────────────────────────────────────────────────────── */

function About() {
  const photo = sitePhoto("about-delphique");
  return (
    <section className="bg-stage py-24 lg:py-36" aria-labelledby="about-title">
      <div className="wrap grid items-center gap-12 lg:grid-cols-[5fr_6fr] lg:gap-24">
        {photo && (
          <div className="aspect-[4/5] max-h-[640px] overflow-hidden bg-ink [clip-path:polygon(0_0,100%_0,100%_88%,86%_100%,0_100%)]">
            <img src={photo} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" style={{ filter: "brightness(0.8)" }} />
          </div>
        )}
        <div>
          <h2 id="about-title" className="h-section mb-8 max-w-[14ch]">
            The Red Carpet Event of MDI Gurgaon
          </h2>
          {site.aboutDelphique.slice(0, 2).map((p) => (
            <p key={p} className="lede mb-5">
              <Rich text={p} />
            </p>
          ))}
          {site.mission && (
            <blockquote className="my-10 border-l border-carpet pl-6 font-display text-[1.375rem] leading-snug text-paper">
              {site.mission}
            </blockquote>
          )}
          <Link to="/about" className="link text-[0.9375rem]">
            Read About Delphique and MDI
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Speakers (hidden until photos are added) ──────────────────────────── */

function SpeakerCard({ p, past = false }: { p: Speaker; past?: boolean }) {
  return (
    <>
      <img src={p.photo} alt="" draggable={false} loading="lazy" decoding="async" width={480} height={600} className="mb-4 aspect-[4/5] h-auto w-full bg-stage object-cover" />
      <p className="font-display text-lg leading-tight">{p.name}</p>
      <p className="mt-1 text-sm text-mute">{p.role}</p>
      {past && <p className="mt-2 text-sm text-gold">Delphique {p.year}</p>}
    </>
  );
}

/**
 * Upcoming speakers (this edition) in a grid, and everyone who has spoken before in a
 * strip that only ever grows. Speakers move from one to the other by themselves.
 */
function Speakers() {
  if (!speakers.length && !pastSpeakers.length) return null;
  const label = "mb-8 flex items-center gap-3 text-base font-medium tracking-[0.02em] text-paper";
  return (
    <section className="overflow-hidden py-24 lg:py-36" aria-labelledby="speakers-title">
      <div className="wrap">
        <SectionHead id="speakers-title" title="Speakers">
          {speakers.length ? `Industry leaders on the Delphique ${site.eventYear} stage, and the ones who came before them.` : "Industry leaders who have taken the Delphique stage."}
        </SectionHead>
        {speakers.length > 0 && (
          <>
            <h3 className={label}>
              <span className="h-px w-8 bg-carpet" />
              Upcoming at Delphique {site.eventYear}
            </h3>
            <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
              {speakers.map((p) => (
                <li key={p.photo}>
                  <SpeakerCard p={p} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {pastSpeakers.length > 0 && (
        <div className={speakers.length ? "mt-20 lg:mt-28" : ""}>
          <div className="wrap">
            <h3 className={label}>
              <span className="h-px w-8 bg-carpet" />
              Past Speakers
            </h3>
          </div>
          <Carousel items={pastSpeakers} label="Past speakers" itemClassName="w-[168px] md:w-[210px]" render={(p) => <SpeakerCard p={p} past />} />
        </div>
      )}
    </section>
  );
}

/* ── Gallery preview: six thumbnails, full gallery on its own page ─────── */

function GalleryPreview() {
  const photos = previewPhotos(5);
  // Put the highest-resolution photo in the large tile so it never looks blurry.
  const best = photos.reduce((b, p, i) => (p.width > photos[b].width ? i : b), 0);
  if (best > 0) photos.unshift(...photos.splice(best, 1));
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;
  return (
    <section className="py-24 lg:py-36" aria-labelledby="gallery-title">
      <div className="wrap">
        <SectionHead id="gallery-title" title="Moments From Past Editions" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {photos.map((p, i) => (
            <button
              key={p.thumb}
              onClick={() => setOpen(i)}
              className={`group relative overflow-hidden bg-stage ${i === 0 ? "col-span-2 aspect-[4/3] md:row-span-2 md:aspect-auto" : "aspect-[4/3]"}`}
              aria-label={`Open photo ${i + 1}`}
            >
              <img src={p.thumb} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            </button>
          ))}
        </div>
        <div className="mt-10">
          <Link to="/gallery" className="btn btn-ghost">
            Open the Full Gallery
          </Link>
        </div>
      </div>
      {open !== null && <Lightbox photos={photos} index={open} onChange={setOpen} onClose={() => setOpen(null)} />}
    </section>
  );
}

/* ── Team strip: drifts on its own, with arrows, a slider and swipe ───── */

function TeamStrip() {
  // The website team is on the Team page, not in this strip.
  const people = team.filter((g) => !g.website).flatMap((g) => g.people.map((p) => ({ ...p, role: p.role || g.member })));
  const join = link("join_team");
  if (!people.length) return null;
  return (
    <section className="overflow-hidden border-t border-line bg-stage py-24 lg:py-36" aria-labelledby="team-title">
      <div className="wrap">
        <SectionHead id="team-title" title="The People Behind Delphique" />
      </div>
      <Carousel items={people} label="Team members" itemClassName="w-[168px] md:w-[200px]" render={(p) => <PersonCard p={p} />} />
      <div className="wrap mt-12 flex flex-wrap gap-4">
        <Link to="/team" className="btn btn-ghost">
          Meet the Whole Team
        </Link>
        {join && (
          <A href={join} className="btn btn-primary">
            Join the Team
          </A>
        )}
      </div>
    </section>
  );
}

/* ── Partners ──────────────────────────────────────────────────────────── */

function Partners() {
  const partnerLink = link("partner_with_us") || contact.emails[0]?.href || "";
  return (
    <section className="py-24 lg:py-32" aria-labelledby="partners-title">
      <div className="wrap">
        {partners.length > 0 && (
          <>
            <h2 id="partners-title" className="mb-10 text-center font-display text-2xl text-mute">
              Our Partners
            </h2>
            {/* Light tiles so any logo (dark, coloured, or a JPG with a white box) stays visible. */}
            <ul className="mb-20 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {partners.map((p) => (
                <li key={p.src} className="grid h-24 place-items-center bg-white px-6 md:h-28">
                  <img src={p.src} alt={p.name} loading="lazy" className="max-h-12 w-auto max-w-full object-contain md:max-h-14" />
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="grid gap-8 border border-line p-8 md:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 id={partners.length ? undefined : "partners-title"} className="display mb-4 text-[clamp(1.75rem,3vw,2.5rem)]">
              Partner With Delphique
            </h2>
            <p className="lede">
              Put your brand in front of students from India's leading B-schools across two days of competitions, panels and live projects.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 lg:justify-end">
            {partnerLink && (
              <A href={partnerLink} className="btn btn-primary">
                Partner With Us
              </A>
            )}
            <BrochureButton />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Final call to action ──────────────────────────────────────────────── */

function FinalCall() {
  const photo = sitePhoto("join-us");
  return (
    <section className="relative overflow-hidden bg-oxblood py-28 lg:py-40">
      {photo && <img src={photo} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity" />}
      <div className="wrap relative text-center">
        <h2 className="display mx-auto mb-6 max-w-[16ch] text-[clamp(2.6rem,6vw,5rem)]">Be Part of the <Ordinals text={site.edition} /> Edition</h2>
        <p className="mx-auto mb-12 max-w-[48ch] text-[1.0625rem] leading-relaxed text-paper/80">
          {[site.dates, site.venue].filter(Boolean).join(", ") || site.venue}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <RegisterButton />
          <BrochureButton className="btn border border-paper/40 text-paper hover:border-paper" />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useTitle();
  return (
    <>
      <Hero />
      <Stats />
      <About />
      <Events />
      <JointEvents />
      <Speakers />
      <GalleryPreview />
      <TeamStrip />
      <Partners />
      <FinalCall />
    </>
  );
}
