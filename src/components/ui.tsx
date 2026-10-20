import { useEffect, type ReactNode } from "react";
import { brochure, isExternal, logo, site, type Reg } from "../content";

/** Renders **bold** markup from the content files. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-medium text-paper">
            {p.slice(2, -2)}
          </strong>
        ) : (
          p
        ),
      )}
    </>
  );
}

/** An <a> that opens outside links in a new tab. */
export function A({ href, className, children, ...rest }: { href: string; className?: string; children: ReactNode; "aria-label"?: string }) {
  const ext = isExternal(href) || href.endsWith(".pdf");
  return (
    <a href={href} className={className} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
      {children}
    </a>
  );
}

/**
 * Registration button. What it shows comes from links.txt (and the event dates):
 * a link -> "Register"; blank -> "Registrations open soon"; "closed" -> "Registrations closed";
 * "none" -> nothing at all.
 */
export function RegisterButton({ reg = site.register, label = "Register", small = false }: { reg?: Reg; label?: string; small?: boolean }) {
  const size = small ? " btn-sm" : "";
  if (reg.state === "none") return null;
  if (reg.state !== "open") {
    return (
      <span className={`btn btn-muted${size}`} aria-disabled="true">
        {reg.state === "closed" ? "Registrations closed" : "Registrations open soon"}
      </span>
    );
  }
  return (
    <A href={reg.href} className={`btn btn-primary${size}`}>
      {label}
    </A>
  );
}

export function BrochureButton({ className = "btn btn-ghost" }: { className?: string }) {
  const href = brochure;
  if (!href) return null;
  return (
    <A href={href} className={className}>
      Download the brochure
    </A>
  );
}

/** The Delphique logo from content/logos, or a typeset wordmark until one is added. */
export function Wordmark({ large = false }: { large?: boolean }) {
  if (logo.delphique) {
    // self-start + object-contain: never stretched by the flex column it sits in (the footer).
    return <img src={logo.delphique} alt="Delphique" className={`${large ? "h-20" : "h-12 lg:h-14"} w-auto max-w-full self-start object-contain`} />;
  }
  return (
    <span className="flex flex-col leading-none select-none">
      <span className={`font-display ${large ? "text-[1.6rem]" : "text-[1.15rem]"} tracking-[0.2em]`}>DELPHIQUE</span>
      <span className="mt-1.5 text-[0.7rem] tracking-[0.08em] text-mute">MDI Gurgaon {site.year}</span>
    </span>
  );
}

export function useTitle(title?: string) {
  useEffect(() => {
    const base = `Delphique ${site.year} | National Management Convention of MDI Gurgaon`;
    document.title = title ? `${title} | Delphique ${site.year}` : base;
  }, [title]);
}

/** Section heading with an optional short line beside it on wide screens. */
export function SectionHead({ title, children, id }: { title: ReactNode; children?: ReactNode; id?: string }) {
  return (
    <div className="mb-12 flex flex-col gap-5 lg:mb-16 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
      <h2 id={id} className="h-section max-w-[18ch]">
        {title}
      </h2>
      {children && <div className="lede max-w-[44ch] lg:pb-2">{children}</div>}
    </div>
  );
}
