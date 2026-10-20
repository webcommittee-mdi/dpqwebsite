import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Instagram, Linkedin, Menu, X, Youtube } from "lucide-react";
import { contact, link, logo, site } from "../content";
import { A, RegisterButton, Wordmark } from "./ui";

const NAV = [
  { label: "About", to: "/about" },
  { label: "Events", to: "/#events" },
  { label: "Gallery", to: "/gallery" },
  { label: "Team", to: "/team" },
  { label: "Contact", to: "#contact" },
];

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  const { pathname } = useLocation();
  const base = "text-[0.9375rem] transition-colors duration-200 hover:text-paper";
  if (to.includes("#")) {
    const [path, hash] = to.split("#");
    return (
      <Link to={{ pathname: path || pathname, hash: `#${hash}` }} onClick={onClick} className={`${base} text-mute`}>
        {label}
      </Link>
    );
  }
  return (
    <NavLink to={to} onClick={onClick} className={({ isActive }) => `${base} ${isActive ? "text-paper" : "text-mute"}`}>
      {label}
    </NavLink>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${scrolled || open ? "border-line bg-ink/90 backdrop-blur-md" : "border-transparent bg-ink"}`}>
      <nav className="wrap flex h-[72px] items-center justify-between gap-6" aria-label="Main">
        {/* <Link to="/" aria-label="Delphique home" className="shrink-0"> 
          <Wordmark />
        </Link> */}
       <img src="/content/Logos/logo.png" alt="Delphique" width={120} height={40} className="shrink-0" />
        
        <ul className="hidden items-center gap-9 lg:flex">
          {NAV.map((n) => (
            <li key={n.label}>
              <NavItem {...n} />
            </li>
          ))}
        </ul>
        <div className="hidden lg:block">
          <RegisterButton small />
        </div>
        <button className="grid h-11 w-11 place-items-center lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="wrap flex flex-col gap-5 border-t border-line pb-8 pt-6 lg:hidden">
          {NAV.map((n) => (
            <NavItem key={n.label} {...n} onClick={() => setOpen(false)} />
          ))}
          <div className="pt-2">
            <RegisterButton />
          </div>
        </div>
      )}
    </header>
  );
}

function Social() {
  const items = [
    { key: "instagram", label: "Instagram", Icon: Instagram },
    { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
    { key: "youtube", label: "YouTube", Icon: Youtube },
  ].filter((s) => link(s.key));
  if (!items.length) return null;
  return (
    <div className="flex gap-2">
      {items.map(({ key, label, Icon }) => (
        <A key={key} href={link(key)} aria-label={`Delphique on ${label}`} className="grid h-10 w-10 place-items-center border border-line text-mute transition-colors hover:border-paper hover:text-paper">
          <Icon size={18} />
        </A>
      ))}
    </div>
  );
}

function Footer() {
  const map = link("map");
  const mdi = link("mdi_website");
  return (
    <footer id="contact" className="border-t border-line bg-stage">
      <div className="wrap grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:py-20">
        <div className="flex flex-col gap-6">
          <Wordmark large />
          <p className="max-w-[36ch] text-[0.9375rem] leading-relaxed text-mute">
            The National Management Convention of MDI Gurgaon, and the red carpet event of the institute.
          </p>
          <Social />
        </div>

        <div>
          <h2 className="mb-5 font-display text-xl">Contact</h2>
          <ul className="flex flex-col gap-3 text-[0.9375rem] text-mute">
            {[...contact.emails, ...contact.phones].map((c) => (
              <li key={c.href}>
                <a className="link" href={c.href}>
                  {c.text}
                </a>
              </li>
            ))}
            {site.venue && <li>{map ? <A href={map} className="link">{site.venue}</A> : site.venue}</li>}
          </ul>
        </div>

        <div>
          <h2 className="mb-5 font-display text-xl">Explore</h2>
          <ul className="grid grid-cols-2 gap-3 text-[0.9375rem] text-mute lg:grid-cols-1">
            {NAV.filter((n) => n.label !== "Contact").map((n) => (
              <li key={n.label}>
                <NavItem {...n} />
              </li>
            ))}
            {mdi && (
              <li>
                <A href={mdi} className="hover:text-paper">
                  MDI Gurgaon website
                </A>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="wrap">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-line py-6 text-sm text-mute md:flex-row md:items-center">
          <div className="flex flex-col gap-1.5">
            <p>© {site.year} Delphique, Management Development Institute Gurgaon</p>
            {/* Website credit. Kept in the code (not in /content) on purpose. */}
            <p>
              Made in association with the <span className="text-paper">Web Committee, MDI Gurgaon</span>
            </p>
          </div>
          {logo.mdi && <img src={logo.mdi} alt="MDI Gurgaon" className="h-8 w-auto opacity-80" />}
        </div>
      </div>
    </footer>
  );
}

/** Scrolls to the top on page change, or to #section when the link has one. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    let tries = 0;
    const find = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (tries++ < 20) setTimeout(find, 50);
    };
    find();
  }, [pathname, hash]);
  return null;
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      {site.announcement.length > 0 && (
        <div className="bg-carpet px-4 py-2 text-center text-sm text-white">
          {site.announcement.map((part, i) =>
            part.href ? (
              <A key={i} href={part.href} className="underline underline-offset-2">
                {part.text}
              </A>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </div>
      )}
      <Header />
      <ScrollManager />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
