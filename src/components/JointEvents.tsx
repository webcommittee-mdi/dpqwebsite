import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { jointEvents, type JointEvent } from "../content";
import { Carousel } from "./Carousel";
import { A } from "./ui";

const looksLikeForm = (href: string) => /forms|unstop|register|typeform|airtable|tally|konfhub|eventbrite/i.test(href);

function Card({ ev }: { ev: JointEvent }) {
  const body = (
    <>
      <div className="relative mb-4 aspect-[4/5] overflow-hidden bg-stage">
        {ev.poster ? (
          <img src={ev.poster} alt={`${ev.name} poster`} draggable={false} loading="lazy" decoding="async" className="h-full w-full object-contain" />
        ) : (
          // No poster yet: a typeset tile so the strip still looks finished.
          <div className="flex h-full flex-col justify-between border border-line p-5">
            <p className="text-sm text-mute">Delphique ×</p>
            <p className="font-display text-[1.6rem] leading-tight text-gold">{ev.partner || ev.name}</p>
          </div>
        )}
      </div>
      <p className="line-clamp-2 font-display text-[1.125rem] leading-snug text-paper">{ev.name}</p>
      {ev.partner && <p className="mt-1 truncate text-sm text-mute">with {ev.partner}</p>}
      {ev.date && <p className="mt-1 text-sm text-gold">{ev.date}</p>}
      {ev.link && <p className="mt-3 text-sm text-paper underline decoration-carpet underline-offset-4">{looksLikeForm(ev.link) ? "Register" : "Details"}</p>}
    </>
  );
  return ev.link ? (
    <A href={ev.link} className="block" aria-label={`${ev.name}${ev.partner ? ` with ${ev.partner}` : ""}${ev.date ? `, ${ev.date}` : ""}`}>
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
    return jointEvents
      .filter((e) => Number.isNaN(e.endsAt) || e.endsAt > now)
      .sort((a, b) => (Number.isNaN(a.endsAt) ? 1 : Number.isNaN(b.endsAt) ? -1 : a.endsAt - b.endsAt));
  }, []);

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return upcoming;
    return upcoming.filter((e) => words.every((w) => e.search.includes(w)));
  }, [query, upcoming]);

  if (!upcoming.length) return null;

  return (
    <section id="joint-events" className="border-t border-line py-24 lg:py-32" aria-labelledby="joint-title">
      <div className="wrap mb-10 flex flex-col gap-8 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="joint-title" className="display mb-4 text-[clamp(1.9rem,3.4vw,2.8rem)]">
            Joint events
          </h2>
          <p className="lede">With MDI's clubs, committees and student interest groups.</p>
        </div>
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
      </div>

      {shown.length > 0 ? (
        <Carousel items={shown} render={(ev) => <Card ev={ev} />} itemClassName="w-[200px] md:w-[240px]" label="Joint events" auto={!query} />
      ) : (
        <div className="wrap">
          <p className="lede">
            No joint events match “{query}”.{" "}
            <button onClick={() => setQuery("")} className="link">
              Show all
            </button>
          </p>
        </div>
      )}
    </section>
  );
}
