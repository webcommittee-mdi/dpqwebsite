import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { jointEvents, type JointEvent } from "../content";
import { Carousel } from "./Carousel";
import { A } from "./ui";

const looksLikeForm = (href: string) => /forms|unstop|register|typeform|airtable|tally|konfhub|eventbrite/i.test(href);
/** "Panel Discussion", "Fireside Chat"…: the kind of session, shown as it is, not as "with …". */
const isFormat = (s: string) => /\b(panel|discussion|talk|keynote|fireside|chat|session|workshop|masterclass|conclave|summit|dialogue)\b/i.test(s);

function Card({ ev, ratio }: { ev: JointEvent; ratio: number }) {
  const body = (
    <>
      <div className="relative mb-4 overflow-hidden bg-stage" style={{ aspectRatio: ratio }}>
        {ev.poster ? (
          <img src={ev.poster} alt={`${ev.name} poster`} draggable={false} loading="lazy" decoding="async" className="h-full w-full object-contain" />
        ) : (
          // No poster yet: a typeset tile, so the strip still looks finished.
          <div className="flex h-full flex-col justify-between bg-gradient-to-b from-oxblood/70 via-stage to-stage p-5 ring-1 ring-inset ring-line">
            <p className="text-sm font-medium text-paper">
              {isFormat(ev.partner) ? (
                ev.partner
              ) : (
                <>
                  Delphique <span className="text-carpet">×</span> {ev.partner || "MDI"}
                </>
              )}
            </p>
            <p className="font-display text-[1.75rem] leading-[1.1] text-paper text-balance">{ev.name}</p>
          </div>
        )}
      </div>
      <p className="line-clamp-2 font-display text-[1.125rem] leading-snug text-paper">{ev.name}</p>
      {ev.partner && <p className="mt-1 truncate text-sm text-mute">{isFormat(ev.partner) ? ev.partner : `with ${ev.partner}`}</p>}
      {ev.date && <p className="mt-1 text-sm text-gold">{ev.date}</p>}
      {ev.link && <p className="mt-3 text-sm text-paper underline decoration-carpet underline-offset-4">{looksLikeForm(ev.link) ? "Register Now" : "Details"}</p>}
    </>
  );
  return ev.link ? (
    <A href={ev.link} className="block" aria-label={`${ev.name}${ev.partner ? (isFormat(ev.partner) ? `, ${ev.partner}` : ` with ${ev.partner}`) : ""}${ev.date ? `, ${ev.date}` : ""}`}>
      {body}
    </A>
  ) : (
    <div>{body}</div>
  );
}

/**
 * Events Delphique runs with other clubs, committees and SIGs. The list changes
 * often, so it's a moving strip with a search box rather than a grid.
 * Past events drop off by themselves the day after their date.
 */
export function JointEvents() {
  const [query, setQuery] = useState("");

  const upcoming = useMemo(() => {
    const now = Date.now();
    const sorted = jointEvents
      .filter((e) => Number.isNaN(e.endsAt) || e.endsAt > now)
      .sort((a, b) => (Number.isNaN(a.endsAt) ? (Number.isNaN(b.endsAt) ? 0 : 1) : Number.isNaN(b.endsAt) ? -1 : a.endsAt - b.endsAt)); // undated last, in file order
    // A joint event, then a panel discussion, and so on (each kind keeps its own order).
    const panels = sorted.filter((e) => isFormat(e.partner));
    const joint = sorted.filter((e) => !isFormat(e.partner));
    return Array.from({ length: Math.max(panels.length, joint.length) }, (_, i) => [joint[i], panels[i]])
      .flat()
      .filter((e): e is JointEvent => Boolean(e));
  }, []);

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return upcoming;
    return upcoming.filter((e) => words.every((w) => e.search.includes(w)));
  }, [query, upcoming]);

  // Every card in the strip has the same shape: the middle (median) shape of the posters,
  // kept between a phone story (1:2) and a square, so no poster is shrunk or cut.
  const ratio = useMemo(() => {
    const r = upcoming.map((e) => e.posterRatio).filter((x): x is number => !!x).sort((a, b) => a - b);
    const mid = r.length ? r[Math.floor(r.length / 2)] : 0.8;
    return Math.min(1, Math.max(0.5, mid));
  }, [upcoming]);

  if (!upcoming.length) return null;

  return (
    <section id="joint-events" className="border-t border-line py-24 lg:py-32" aria-labelledby="joint-title">
      <div className="wrap mb-10 flex flex-col gap-8 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="joint-title" className="display mb-4 text-[clamp(1.9rem,3.4vw,2.8rem)]">
            Joint Events and Panel Discussions
          </h2>
          <p className="lede">With MDI's clubs, committees and student interest groups, and conversations with leaders from industry.</p>
        </div>
        {/* A search box only once the list is long enough to need one. */}
        {upcoming.length > 6 && (
        <div className="w-full lg:max-w-[380px]">
          <label className="flex h-12 items-center gap-3 border border-line-strong px-4 transition-colors focus-within:border-paper">
            <Search size={18} className="shrink-0 text-mute" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, clubs or dates"
              aria-label="Search joint events"
              className="h-full min-w-0 flex-1 bg-transparent text-[0.9375rem] text-paper placeholder:text-mute focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button onClick={() => setQuery("")} className="grid h-8 w-8 place-items-center text-mute hover:text-paper" aria-label="Clear search">
                <X size={18} />
              </button>
            )}
          </label>
          <p className="mt-2 h-5 text-sm text-mute" aria-live="polite">
            {query ? `${shown.length} of ${upcoming.length} events` : ""}
          </p>
        </div>
        )}
      </div>

      {shown.length > 0 ? (
        <Carousel items={shown} render={(ev) => <Card ev={ev} ratio={ratio} />} itemClassName="w-[200px] md:w-[240px]" label="Joint events and panel discussions" auto={!query} />
      ) : (
        <div className="wrap">
          <p className="lede">
            No joint events match “{query}”.{" "}
            <button onClick={() => setQuery("")} className="link">
              Show All
            </button>
          </p>
        </div>
      )}
    </section>
  );
}
