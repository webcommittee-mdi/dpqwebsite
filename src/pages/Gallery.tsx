import { useState } from "react";
import { useSearchParams } from "react-router";
import { galleryYears, type Album } from "../content";
import { Lightbox } from "../components/Lightbox";
import { useTitle } from "../components/ui";

function AlbumGrid({ album, onOpen }: { album: Album; onOpen: (i: number) => void }) {
  return (
    <div className="columns-2 gap-2 md:columns-3 md:gap-3 xl:columns-4">
      {album.photos.map((p, i) => (
        <button
          key={p.thumb}
          onClick={() => onOpen(i)}
          className="group mb-2 block w-full overflow-hidden bg-stage md:mb-3"
          aria-label={`Open photo ${i + 1} of ${album.photos.length} from ${album.title}`}
        >
          <img
            src={p.thumb}
            width={p.width}
            height={p.height}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </button>
      ))}
    </div>
  );
}

const chip = (active: boolean) =>
  `shrink-0 border px-4 py-2 text-sm transition-colors ${active ? "border-paper text-paper" : "border-line text-mute hover:border-line-strong hover:text-paper"}`;

export default function Gallery() {
  useTitle("Gallery");
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState<{ album: Album; index: number } | null>(null);

  const year = galleryYears.find((y) => y.year === params.get("year"));
  const album = year?.albums.find((a) => a.id === params.get("album"));
  const shownYears = year ? [year] : galleryYears;

  const pick = (next: { year?: string; album?: string }) => {
    const p: Record<string, string> = {};
    if (next.year) p.year = next.year;
    if (next.album) p.album = next.album;
    setParams(p);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <section className="pb-10 pt-16 lg:pt-24">
        <div className="wrap">
          <h1 className="display text-[clamp(2.8rem,6.4vw,5.4rem)]">Delphique Gallery</h1>
        </div>
      </section>

      {galleryYears.length > 0 && (galleryYears.length > 1 || galleryYears[0].albums.length > 1) && (
        <nav aria-label="Filter the gallery" className="sticky top-[72px] z-30 border-y border-line bg-ink/95 backdrop-blur">
          {galleryYears.length > 1 && (
            <div className="wrap no-scrollbar flex gap-2 overflow-x-auto py-3">
              <button className={chip(!year)} onClick={() => pick({})} aria-pressed={!year}>
                All years
              </button>
              {galleryYears.map((y) => (
                <button key={y.year} className={chip(year?.year === y.year)} onClick={() => pick({ year: y.year })} aria-pressed={year?.year === y.year}>
                  {y.year}
                </button>
              ))}
            </div>
          )}
          {(() => {
            // Second row: the selected year's albums (or the only year's albums).
            const y = year ?? (galleryYears.length === 1 ? galleryYears[0] : undefined);
            if (!y || y.albums.length < 2) return null;
            return (
              <div className={galleryYears.length > 1 ? "border-t border-line" : ""}>
              <div className="wrap no-scrollbar flex gap-2 overflow-x-auto py-3">
                <button className={chip(!album)} onClick={() => pick({ year: year ? y.year : undefined })} aria-pressed={!album}>
                  {y.year === "Other" ? "All albums" : `All of ${y.year}`}
                </button>
                {y.albums.map((a) => (
                  <button key={a.id} className={chip(album?.id === a.id)} onClick={() => pick({ year: y.year, album: a.id })} aria-pressed={album?.id === a.id}>
                    {a.title}
                  </button>
                ))}
              </div>
              </div>
            );
          })()}
        </nav>
      )}

      <div className="wrap py-12 lg:py-16">
        {galleryYears.length === 0 && <p className="lede">Photos will appear here once they are added to content/photos/gallery.</p>}
        {shownYears.map((y) => (
          <section key={y.year} className="mb-24 last:mb-0" aria-labelledby={`year-${y.year}`}>
            <h2 id={`year-${y.year}`} className="mb-10 flex items-baseline gap-5 font-display text-[clamp(2.4rem,5vw,4rem)] leading-none text-gold">
              {y.year}
              <span className="font-sans text-sm text-mute">
                {y.albums.length} {y.albums.length === 1 ? "album" : "albums"}, {y.photoCount} photos
              </span>
            </h2>
            {(album ? [album] : y.albums).map((a) => (
              <section key={a.id} className="mb-16 last:mb-0" aria-label={a.title}>
                <div className="mb-5 flex items-baseline justify-between gap-6 border-b border-line pb-4">
                  <h3 className="font-display text-[clamp(1.4rem,2.2vw,1.9rem)] leading-tight">{a.title}</h3>
                  <p className="shrink-0 text-sm text-mute">{a.photos.length} photos</p>
                </div>
                <AlbumGrid album={a} onOpen={(index) => setOpen({ album: a, index })} />
              </section>
            ))}
          </section>
        ))}
      </div>

      {open && (
        <Lightbox
          photos={open.album.photos}
          index={open.index}
          onChange={(index) => setOpen({ ...open, index })}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
