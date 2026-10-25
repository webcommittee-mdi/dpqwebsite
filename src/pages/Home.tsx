import { useEffect, useState } from "react";
import { Link } from "react-router";
import { contact, events, heroSlides, link, partners, previewPhotos, site, sitePhoto, speakers, team, type Event } from "../content";
import { Countdown } from "../components/Countdown";
import { Lightbox } from "../components/Lightbox";
import { Carousel } from "../components/Carousel";
import { JointEvents } from "../components/JointEvents";
import { A, BrochureButton, RegisterButton, Rich, SectionHead, useTitle } from "../components/ui";

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
      <div className="absolute inset-x-0 top-0 h-[48svh] lg:inset-y-0 lg:left-[44%] lg:h-auto lg:[clip-path:polygon(14%_0,100%_0,100%_100%,0_100%)]" aria-hidden="true">
        {heroSlides.map((s, i) =>
          i < reached ? (
            <img
              key={s.src}
              src={s.src}
              srcSet={s.small ? `${s.small} 900w, ${s.src} 1920w` : undefined}
              sizes="(min-width: 1024px) 56vw, 100vw"
              alt=""
              fetchPriority={i === 0 ? "high" : "low"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms]"
              style={{ opacity: i === slide ? 1 : 0, filter: "brightness(0.82) saturate(1.05)" }}
            />
          ) : null,
        )}
        {/* Phones: fade the bottom of the band into the page. Wide screens: fade the left edge. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/10 lg:bg-gradient-to-r lg:from-ink lg:via-ink/25 lg:to-transparent" />
        {/* A warm, deep-red wash that ties the photos to the site's colours, and a dark foot for the slide labels. */}
        <div className="absolute inset-0 bg-gradient-to-br from-oxblood/25 via-transparent to-transparent mix-blend-multiply" />
        <div className="absolute inset-x-0 bottom-0 hidden h-1/3 bg-gradient-to-t from-ink/85 to-transparent lg:block" />
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
              Explore the events
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
                className="flex h-8 items-center gap-2.5"
                aria-label={`Show photo: ${s.caption || i + 1}`}
                aria-current={i === slide}
              >
                <span className={`h-px transition-all duration-500 ${i === slide ? "w-8 bg-gold" : "w-3 bg-mute/60"}`} />
                {i === slide && s.caption && <span className="text-sm text-gold">{s.caption}</span>}
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
            <dd className="font-display text-[clamp(2rem,3.6vw,3rem)] leading-none text-gold">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ── Events ────────────────────────────────────────────────────────────── */

/** `wide` = the last card when there is an odd number of events: it spans the full row, photo beside text. */
function EventCard({ ev, wide = false }: { ev: Event; wide?: boolean }) {
  const hasMedia = Boolean(ev.photo || ev.logo);
  return (
    <article className={`flex flex-col bg-ink ${wide ? "md:col-span-2 md:grid md:grid-cols-2" : ""}`}>
      {hasMedia && (
        <div className={`relative aspect-[16/9] overflow-hidden bg-stage ${wide ? "md:aspect-auto md:min-h-full" : ""}`}>
          {ev.photo && <img src={ev.photo} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ filter: "brightness(0.7)" }} />}
          {ev.logo && (
            <div className="absolute bottom-4 left-4 bg-white px-3 py-2">
              <img src={ev.logo} alt={`${ev.title} logo`} className="h-10 w-auto max-w-[180px] object-contain" />
            </div>
          )}
        </div>
      )}
      <div className={`flex flex-1 flex-col p-6 md:p-8 lg:p-10 ${wide && !hasMedia ? "md:col-span-2" : ""}`}>
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
        <ul className="mb-8 flex flex-col gap-2.5">
          {ev.points.map((p) => (
            <li key={p} className="flex gap-3 text-[0.9375rem] leading-relaxed text-mute">
              <span className="mt-[0.7em] h-px w-3 shrink-0 bg-carpet" />
              {p}
            </li>
          ))}
        </ul>
        {ev.reg.state !== "none" && (
          <div className="mt-auto">
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
        <SectionHead id="events-title" title="Flagship events">
          Competitions and conversations that bring students from India's leading B-schools to MDI every year.
        </SectionHead>
        <div className="grid gap-px bg-line md:grid-cols-2">
          {events.map((ev, i) => (
            <EventCard key={ev.id} ev={ev} wide={events.length % 2 === 1 && i === events.length - 1} />
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
            Read about Delphique and MDI
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Speakers (hidden until photos are added) ──────────────────────────── */

function Speakers() {
  if (!speakers.length) return null;
  return (
    <section className="py-24 lg:py-36" aria-labelledby="speakers-title">
      <div className="wrap">
        <SectionHead id="speakers-title" title="Speakers">
          Industry leaders on the Delphique {site.eventYear} stage.
        </SectionHead>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {speakers.map((p) => (
            <li key={p.photo}>
              <img src={p.photo} alt="" loading="lazy" decoding="async" className="mb-4 aspect-[4/5] w-full object-cover" />
              <p className="font-display text-lg leading-tight">{p.name}</p>
              <p className="mt-1 text-sm text-mute">{p.role}</p>
            </li>
          ))}
        </ul>
      </div>
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
        <SectionHead id="gallery-title" title="Moments from past editions" />
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
            Open the full gallery
          </Link>
        </div>
      </div>
      {open !== null && <Lightbox photos={photos} index={open} onChange={setOpen} onClose={() => setOpen(null)} />}
    </section>
  );
}

/* ── Team strip: drifts on its own, with arrows, a slider and swipe ───── */

function TeamStrip() {
  const people = team.flatMap((g) => g.people);
  const join = link("join_team");
  if (!people.length) return null;
  return (
    <section className="overflow-hidden border-t border-line bg-stage py-24 lg:py-36" aria-labelledby="team-title">
      <div className="wrap">
        <SectionHead id="team-title" title="The people behind Delphique" />
      </div>
      <Carousel
        items={people}
        label="Team members"
        itemClassName="w-[168px] md:w-[200px]"
        render={(p) => (
          <>
            <img src={p.photo} alt="" draggable={false} loading="lazy" decoding="async" width={480} height={600} className="mb-3 aspect-[4/5] h-auto w-full bg-ink object-cover" />
            <p className="truncate font-display text-[1.0625rem] leading-tight">{p.name}</p>
            <p className="mt-1 truncate text-sm text-mute">{p.role}</p>
          </>
        )}
      />
      <div className="wrap mt-12 flex flex-wrap gap-4">
        <Link to="/team" className="btn btn-ghost">
          Meet the whole team
        </Link>
        {join && (
          <A href={join} className="btn btn-primary">
            Join the team
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
              Our partners
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
              Partner with Delphique
            </h2>
            <p className="lede">
              Put your brand in front of students from India's leading B-schools across two days of competitions, panels and live projects.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 lg:justify-end">
            {partnerLink && (
              <A href={partnerLink} className="btn btn-primary">
                Partner with us
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
        <h2 className="display mx-auto mb-6 max-w-[16ch] text-[clamp(2.6rem,6vw,5rem)]">Be part of the {site.edition} edition</h2>
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
      <Events />
      <JointEvents />
      <About />
      <Speakers />
      <GalleryPreview />
      <TeamStrip />
      <Partners />
      <FinalCall />
    </>
  );
}
