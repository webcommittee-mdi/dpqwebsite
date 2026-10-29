import { link, slug, team } from "../content";
import { A, useTitle } from "../components/ui";
import { PersonCard } from "../components/PersonCard";

export default function Team() {
  useTitle("Team");
  const join = link("join_team");

  return (
    <>
      <section className="pb-12 pt-16 lg:pb-16 lg:pt-24">
        <div className="wrap">
          <h1 className="display text-[clamp(2.8rem,6.4vw,5.4rem)]">The Team</h1>
        </div>
      </section>

      <div className="wrap pb-20">
        {team.length === 0 && <p className="lede">Team photos will appear here once they are added to content/photos/team.</p>}
        {team.map((group) => (
          <section key={group.title} className="mb-20 last:mb-0" aria-labelledby={`group-${slug(group.title)}`}>
            <div className="mb-8 flex items-baseline justify-between gap-6 border-b border-line pb-4">
              <h2 id={`group-${slug(group.title)}`} className="font-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight">
                {group.title}
              </h2>
              <p className="shrink-0 text-sm text-mute">{group.people.length} people</p>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {group.people.map((p) => (
                <li key={p.photo}>
                  {/* No position in the file name: the group says it ("Senior Member", "Member"). */}
                  <PersonCard p={{ ...p, role: p.role || (group.website ? "" : group.member) }} large />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {join && (
        <section className="border-t border-line bg-stage py-20 lg:py-28">
          <div className="wrap flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="display mb-3 text-[clamp(1.9rem,3.4vw,2.8rem)]">Want to Be on This Page Next Year?</h2>
              <p className="lede">Applications to join the Delphique team are open to MDI students.</p>
            </div>
            <A href={join} className="btn btn-primary">
              Join the Team
            </A>
          </div>
        </section>
      )}
    </>
  );
}
