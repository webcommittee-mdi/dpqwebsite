import { useEffect } from "react";
import { albums, events, jointEvents, problems, site, speakers, team } from "../content";
import { useTitle } from "../components/ui";

/**
 * Hidden page (not in the menu, not shown to search engines): mdi-delphique.com/check
 * Lists anything in /content the website ignored or couldn't read, so the
 * Delphique team can fix it themselves.
 */
export default function Check() {
  useTitle("Website check");
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const now = Date.now();
  const upcoming = jointEvents.filter((e) => Number.isNaN(e.endsAt) || e.endsAt > now).length;
  const summary = [
    ["Flagship events", events.length],
    ["Joint events coming up", `${upcoming} (of ${jointEvents.length} listed)`],
    ["Gallery albums", albums.length],
    ["Team groups", `${team.length} (${team.reduce((n, g) => n + g.people.length, 0)} people)`],
    ["Speakers", speakers.length],
    ["Event dates", site.dates || (site.eventOver ? "the event has passed" : "not set")],
  ];

  return (
    <section className="wrap py-16 lg:py-24">
      <h1 className="display mb-4 text-[clamp(2.4rem,5vw,4rem)]">Website check</h1>
      <p className="lede mb-3">
        This page lists anything in the content folder the website ignored or couldn't read.
        Fix it on GitHub, wait three minutes, and refresh this page.
      </p>
      <p className="mb-12 text-sm text-mute">
        Last updated {new Date(__BUILT_AT__).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}.
        If your change was after this, wait a minute and refresh.
      </p>

      <h2 className="mb-4 font-display text-2xl">{problems.length ? `${problems.length} thing${problems.length > 1 ? "s" : ""} to look at` : "Everything was understood"}</h2>
      {problems.length > 0 ? (
        <ul className="mb-14 flex flex-col gap-5">
          {problems.map((p) => (
            <li key={p.what} className="border-l-2 border-carpet pl-4 text-[0.9375rem] leading-relaxed [overflow-wrap:anywhere]">
              <p className="text-paper">{p.what}</p>
              <p className="mt-1 text-mute">
                <span className="text-gold">Fix: </span>
                {p.fix}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="lede mb-14">Nothing was ignored.</p>
      )}

      <h2 className="mb-4 font-display text-2xl">What the website found</h2>
      <dl className="grid max-w-xl grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-[0.9375rem]">
        {summary.map(([k, v]) => (
          <div key={String(k)} className="contents">
            <dt className="text-mute">{k}</dt>
            <dd className="[overflow-wrap:anywhere]">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
