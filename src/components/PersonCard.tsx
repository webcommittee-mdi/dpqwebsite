import { Linkedin } from "lucide-react";
import type { Person } from "../content";
import { A } from "./ui";

/**
 * A team member: photo, name and position. With a LinkedIn link in content/team.txt,
 * the whole card opens their profile, and a small LinkedIn mark shows it.
 */
export function PersonCard({ p, large = false }: { p: Person; large?: boolean }) {
  const body = (
    <>
      <span className="relative mb-3 block overflow-hidden bg-ink">
        <img
          src={p.photo}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          width={480}
          height={600}
          className="aspect-[4/5] h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        {p.linkedin && (
          <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center bg-ink/80 text-paper transition-colors group-hover:bg-[#0a66c2]" aria-hidden="true">
            <Linkedin size={16} />
          </span>
        )}
      </span>
      <span className={`block font-display leading-tight ${large ? "text-lg" : "truncate text-[1.0625rem]"}`}>{p.name}</span>
      {p.role && <span className={`mt-1 block text-sm text-mute ${large ? "" : "truncate"}`}>{p.role}</span>}
    </>
  );
  return p.linkedin ? (
    <A href={p.linkedin} className="group block" aria-label={`${p.name}${p.role ? `, ${p.role}` : ""}, on LinkedIn`}>
      {body}
    </A>
  ) : (
    <div className="group">{body}</div>
  );
}
