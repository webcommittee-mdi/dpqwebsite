import { useState } from "react";
import { allPhotos } from "../content";
import { Lightbox } from "../components/Lightbox";
import { useTitle } from "../components/ui";

/** Every gallery photo in one grid (newest folder first). Tap a photo to see it full size. */
export default function Gallery() {
  useTitle("Gallery");
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <section className="pb-10 pt-16 lg:pt-24">
        <div className="wrap">
          <h1 className="display text-[clamp(2.8rem,6.4vw,5.4rem)]">Delphique Gallery</h1>
        </div>
      </section>

      <div className="wrap pb-24 lg:pb-32">
        {allPhotos.length === 0 && <p className="lede">Photos will appear here once they are added to content/photos/gallery.</p>}
        <div className="columns-2 gap-2 md:columns-3 md:gap-3 xl:columns-4">
          {allPhotos.map((p, i) => (
            <button
              key={p.thumb}
              onClick={() => setOpen(i)}
              className="group mb-2 block w-full overflow-hidden bg-stage md:mb-3"
              aria-label={`Open photo ${i + 1} of ${allPhotos.length}`}
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
      </div>

      {open !== null && <Lightbox photos={allPhotos} index={open} onChange={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}
