import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventItem } from "../server/db/schema";

const CATEGORY_COLORS: Record<string, string> = {
  fixture: "#dc2626",
  festival: "#f59e0b",
  tournament: "#2563eb",
  training: "#16a34a",
};

export function EventsCalendar({ events }: { events: EventItem[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const { weeks, monthLabel } = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7; // Monday-first grid
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    return {
      weeks,
      monthLabel: first.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    };
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of events) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const move = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between bg-neutral-950 px-4 py-3 text-white">
        <button onClick={() => move(-1)} className="rounded p-1 hover:bg-white/10" aria-label="Previous month">
          <ChevronLeft />
        </button>
        <div className="heading text-lg">{monthLabel}</div>
        <button onClick={() => move(1)} className="rounded p-1 hover:bg-white/10" aria-label="Next month">
          <ChevronRight />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b bg-neutral-100 text-center text-xs font-semibold uppercase text-neutral-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flat().map((day, i) => {
          const key = day ? `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}` : `empty-${i}`;
          const dayEvents = day ? eventsByDay.get(key) ?? [] : [];
          const isToday = day && new Date().toDateString() === day.toDateString();
          return (
            <div key={key} className="min-h-[84px] border-b border-r p-1.5 last:border-r-0">
              {day && (
                <>
                  <div className={"text-xs font-semibold " + (isToday ? "text-[#dc2626]" : "text-neutral-400")}>
                    {day.getDate()}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((e) => (
                      <div
                        key={e.id}
                        className="truncate rounded px-1 py-0.5 text-[11px] font-medium text-white"
                        style={{ backgroundColor: e.color || CATEGORY_COLORS[e.category] || "#f59e0b" }}
                        title={`${e.title} — ${e.category}`}
                      >
                        {e.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 p-3 text-xs">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} className="flex items-center gap-1.5 capitalize text-neutral-600">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: color }} /> {cat}
          </span>
        ))}
      </div>
    </div>
  );
}
