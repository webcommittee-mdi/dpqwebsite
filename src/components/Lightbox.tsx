import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Photo } from "../content";

/**
 * Full-screen photo viewer. Opens over any page, so the gallery grids only ever
 * load small thumbnails; the large version loads when someone opens a photo.
 */
export function Lightbox({ photos, index, onClose, onChange }: { photos: Photo[]; index: number; onClose: () => void; onChange: (i: number) => void }) {
  const n = photos.length;
  const photo = photos[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const go = (step: number) => onChange((index + step + n) % n);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    setLoaded(false);
    for (const i of [index + 1, index - 1]) {
      const p = photos[(i + n) % n];
      if (p) new Image().src = p.full;
    }
  }, [index, photos, n]);

  if (!photo) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${n}`}
      className="fixed inset-0 z-[100] flex flex-col bg-[rgb(0_0_0/0.97)]"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm md:px-6">
        <p className="truncate text-mute">
          <span className="text-paper">{index + 1}</span> of {n}
          <span className="mx-2 text-line-strong">/</span>
          {photo.album}
        </p>
        <button ref={closeRef} onClick={onClose} className="grid h-11 w-11 place-items-center text-paper hover:text-gold" aria-label="Close photo viewer">
          <X size={24} />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 md:px-20" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img
          key={photo.thumb}
          src={photo.thumb}
          alt=""
          aria-hidden="true"
          className="absolute max-h-full max-w-[calc(100%-1rem)] object-contain blur-sm md:max-w-[calc(100%-10rem)]"
          style={{ aspectRatio: `${photo.width} / ${photo.height}`, opacity: loaded ? 0 : 1 }}
        />
        <img
          key={photo.full}
          src={photo.full}
          alt={`${photo.album}, photo ${index + 1}`}
          onLoad={() => setLoaded(true)}
          className="relative max-h-full max-w-full object-contain transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
        />
        {n > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-1 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center bg-black/50 text-paper hover:text-gold md:left-5" aria-label="Previous photo">
              <ChevronLeft size={28} />
            </button>
            <button onClick={() => go(1)} className="absolute right-1 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center bg-black/50 text-paper hover:text-gold md:right-5" aria-label="Next photo">
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
