import { useEffect, useState } from "react";

/** Days / hours / minutes until the event (9 am IST). Hidden once it has passed. */
export function Countdown({ to }: { to: number }) {
  const target = to;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (Number.isNaN(target) || target <= now) return null;
  const mins = Math.floor((target - now) / 60_000);
  const parts = [
    { v: Math.floor(mins / 1440), l: "days" },
    { v: Math.floor((mins % 1440) / 60), l: "hours" },
    { v: mins % 60, l: "minutes" },
  ];

  return (
    <div className="flex items-end gap-6" aria-label={`${parts[0].v} days, ${parts[1].v} hours and ${parts[2].v} minutes to go`}>
      {parts.map((p) => (
        <div key={p.l} className="flex flex-col">
          <span className="font-display text-[2rem] leading-none tabular-nums text-gold">{String(p.v).padStart(2, "0")}</span>
          <span className="mt-1 text-xs text-mute">{p.l}</span>
        </div>
      ))}
    </div>
  );
}
