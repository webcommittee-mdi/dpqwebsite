import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SPEED = 28; // auto-scroll speed in px per second
const IDLE_MS = 3500; // auto-scroll resumes this long after someone stops using the controls
const GAP = 16; // px between cards (matches gap-4)

/**
 * A strip of cards that drifts on its own but can also be driven by hand:
 * arrows, the slider, swipe on phones, drag with a mouse, and arrow keys.
 * When there are enough cards to fill the screen, the list is rendered three
 * times so it loops without a visible jump. Used for the team and joint events.
 */
export function Carousel<T>({
  items,
  render,
  itemClassName,
  label,
  auto = true,
}: {
  items: T[];
  render: (item: T) => ReactNode;
  itemClassName: string;
  /** What the cards are, for screen readers and button labels, e.g. "team members". */
  label: string;
  auto?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const pos = useRef(0);
  const resumeAt = useRef(0);
  const press = useRef<{ x: number; left: number; id: number; dragging: boolean } | null>(null);
  const justDragged = useRef(false);
  const copiesRendered = useRef(3);
  const [looping, setLooping] = useState(true);
  const [overflowing, setOverflowing] = useState(true);

  const cardStep = () => {
    const first = track.current?.querySelector("li");
    return first ? first.getBoundingClientRect().width + GAP : 220;
  };
  /** Width of one full set of cards. */
  const unit = () => items.length * cardStep();
  const hold = () => (resumeAt.current = performance.now() + IDLE_MS);

  /**
   * Keep the position inside the middle copy so both directions can loop.
   * `pos` holds the exact (fractional) position; browsers round scrollLeft to
   * whole pixels, so the slow drift has to be accumulated here, not read back.
   */
  const normalise = (fromDom = true) => {
    const el = track.current;
    if (!el || !looping) return;
    const u = unit();
    let x = fromDom ? el.scrollLeft : pos.current;
    if (x < u * 0.5) x += u;
    else if (x >= u * 1.5) x -= u;
    pos.current = x;
    if (fromDom ? x !== el.scrollLeft : true) el.scrollLeft = x;
  };

  const syncSlider = () => {
    const el = track.current;
    if (!el || !slider.current) return;
    const u = unit();
    const max = looping ? u : el.scrollWidth - el.clientWidth;
    const offset = looping ? (((el.scrollLeft - u * 0.5) % u) + u) % u : el.scrollLeft;
    slider.current.value = String(max > 0 ? Math.round((offset / max) * 1000) : 0);
  };

  // Decide whether there are enough cards to loop on this screen size.
  useLayoutEffect(() => {
    const check = () => {
      const el = track.current;
      if (!el) return;
      const oneSet = unit();
      const enough = oneSet > el.clientWidth + cardStep();
      setLooping(enough);
      setOverflowing(el.scrollWidth > el.clientWidth + 1);
      if (enough && copiesRendered.current === 3) {
        el.scrollLeft = oneSet; // start in the middle copy
        pos.current = el.scrollLeft;
      } else if (!enough) {
        el.scrollLeft = 0;
      }
      syncSlider();
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [items, looping]);

  // Auto-scroll loop.
  useEffect(() => {
    if (!auto || !looping || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const el = track.current;
      const dt = Math.min(64, now - last);
      last = now;
      if (el) {
        if (now > resumeAt.current && !press.current) {
          pos.current += (SPEED * dt) / 1000;
          normalise(false);
        } else {
          pos.current = el.scrollLeft;
        }
        syncSlider();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });

  const step = (dir: 1 | -1) => {
    hold();
    normalise();
    track.current?.scrollBy({ left: dir * cardStep(), behavior: "smooth" });
  };

  const scrub = (value: number) => {
    const el = track.current;
    if (!el) return;
    hold();
    const u = unit();
    el.scrollLeft = looping ? u * 0.5 + (value / 1000) * u : (value / 1000) * (el.scrollWidth - el.clientWidth);
    pos.current = el.scrollLeft;
  };

  const copies = looping ? [0, 1, 2] : [0];
  copiesRendered.current = copies.length;
  const buttonClass = "grid h-11 w-11 shrink-0 place-items-center border border-line-strong text-paper transition-colors hover:border-paper";

  return (
    <div>
      <div
        ref={track}
        className="no-scrollbar cursor-grab overflow-x-auto overscroll-x-contain active:cursor-grabbing"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        onScroll={() => {
          if (!looping || !auto) syncSlider();
        }}
        onWheel={hold}
        onTouchStart={hold}
        onTouchEnd={hold}
        onFocus={hold}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || e.button !== 0 || !track.current) return;
          press.current = { x: e.clientX, left: track.current.scrollLeft, id: e.pointerId, dragging: false };
          hold();
        }}
        onPointerMove={(e) => {
          const p = press.current;
          if (!p || !track.current) return;
          const dx = e.clientX - p.x;
          // Only become a drag after a few pixels, so clicks on links inside cards still work.
          if (!p.dragging && Math.abs(dx) > 6) {
            p.dragging = true;
            track.current.setPointerCapture(p.id);
          }
          if (p.dragging) track.current.scrollLeft = p.left - dx;
        }}
        onPointerUp={() => {
          justDragged.current = Boolean(press.current?.dragging);
          press.current = null;
          hold();
          normalise();
        }}
        onPointerCancel={() => (press.current = null)}
        onClickCapture={(e) => {
          if (justDragged.current) {
            e.preventDefault();
            e.stopPropagation();
            justDragged.current = false;
          }
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Side padding matches .wrap, so the first card lines up with the heading above at every width. */}
        <ul className="flex w-max gap-4 px-5 md:px-10 xl:px-[max(4rem,calc((100%_-_1320px)/2_+_4rem))]">
          {copies.flatMap((c) =>
            items.map((item, i) => {
              const hidden = c !== (looping ? 1 : 0);
              return (
                <li
                  key={`${c}-${i}`}
                  className={`shrink-0 select-none ${itemClassName}`}
                  aria-hidden={hidden}
                  // Copies used for looping can't be tabbed into (React 18 needs inert as a string).
                  {...(hidden ? ({ inert: "" } as Record<string, string>) : {})}
                >
                  {render(item)}
                </li>
              );
            }),
          )}
        </ul>
      </div>

      <div className={`wrap mt-8 items-center gap-4 ${looping || overflowing ? "flex" : "hidden"}`}>
        <button onClick={() => step(-1)} className={buttonClass} aria-label={`Previous ${label.toLowerCase()}`}>
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => step(1)} className={buttonClass} aria-label={`Next ${label.toLowerCase()}`}>
          <ChevronRight size={20} />
        </button>
        <input
          ref={slider}
          type="range"
          min={0}
          max={1000}
          defaultValue={0}
          onInput={(e) => scrub(Number((e.target as HTMLInputElement).value))}
          onPointerDown={hold}
          className="team-slider ml-2 min-w-0 flex-1"
          aria-label={`Scroll through ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}
