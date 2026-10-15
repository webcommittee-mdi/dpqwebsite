import { Link } from "react-router";
import { link, logo, site, sitePhoto } from "../content";
import { A, RegisterButton, Rich, useTitle } from "../components/ui";

export default function About() {
  useTitle("About");
  const delphiquePhoto = sitePhoto("about-delphique");
  const campus = sitePhoto("mdi-campus");
  const mdiSite = link("mdi_website");
  const pillars = [
    { label: "Mission", text: site.mission },
    { label: "Vision", text: site.vision },
    { label: "Values", text: site.values },
  ].filter((p) => p.text);

  return (
    <>
      <section className="pb-20 pt-16 lg:pb-28 lg:pt-24">
        <div className="wrap grid gap-12 lg:grid-cols-[6fr_5fr] lg:gap-24">
          <div>
            <h1 className="display mb-10 text-[clamp(2.8rem,6.4vw,5.4rem)]">About Delphique</h1>
            {site.aboutDelphique.map((p) => (
              <p key={p} className="lede mb-6">
                <Rich text={p} />
              </p>
            ))}
          </div>
          {delphiquePhoto && (
            <div className="aspect-[4/5] overflow-hidden bg-stage [clip-path:polygon(0_0,100%_0,100%_88%,86%_100%,0_100%)] lg:mt-6">
              <img src={delphiquePhoto} alt="" className="h-full w-full object-cover" style={{ filter: "brightness(0.8)" }} />
            </div>
          )}
        </div>
      </section>

      {pillars.length > 0 && (
        <section className="border-y border-line bg-stage py-20 lg:py-28" aria-label="Mission, vision and values">
          <dl className="wrap grid gap-12 md:grid-cols-3 md:gap-10">
            {pillars.map((p) => (
              <div key={p.label} className="border-t border-carpet pt-6">
                <dt className="mb-4 text-sm text-carpet">{p.label}</dt>
                <dd className="font-display text-[1.375rem] leading-snug">{p.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="py-20 lg:py-32" aria-labelledby="mdi-title">
        <div className="wrap">
          {campus && (
            <div className="mb-14 aspect-[16/9] overflow-hidden bg-stage md:aspect-[21/9]">
              <img src={campus} alt="The MDI Gurgaon campus" loading="lazy" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="grid gap-12 lg:grid-cols-[6fr_4fr] lg:gap-24">
            <div>
              <h2 id="mdi-title" className="h-section mb-8">
                Management Development Institute, Gurgaon
              </h2>
              {site.aboutMdi.map((p) => (
                <p key={p} className="lede mb-6">
                  <Rich text={p} />
                </p>
              ))}
              {mdiSite && (
                <A href={mdiSite} className="link text-[0.9375rem]">
                  Visit the MDI Gurgaon website
                </A>
              )}
            </div>
            <div className="flex flex-col gap-10 lg:pt-4">
              {logo.mdi && <img src={logo.mdi} alt="MDI Gurgaon" className="h-14 w-auto self-start" />}
              {site.mdiRank && (
                <div>
                  <p className="font-display text-[4.5rem] leading-none text-gold">{site.mdiRank.value}</p>
                  <p className="mt-2 text-mute">{site.mdiRank.label}</p>
                </div>
              )}
              {site.accreditations && <p className="border-t border-line pt-6 font-display text-xl">{site.accreditations}</p>}
              <p className="text-mute">Established 1973</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-20 lg:py-28">
        <div className="wrap flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <h2 className="display max-w-[20ch] text-[clamp(1.9rem,3.4vw,2.8rem)]">See what's on at Delphique {site.year}</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/#events" className="btn btn-ghost">
              Explore the events
            </Link>
            <RegisterButton />
          </div>
        </div>
      </section>
    </>
  );
}
