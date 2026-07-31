import { describe, it, expect } from "vitest";
import { mondayOf, recentMondays, mondaysBetween, isoDate } from "./dates";

describe("mondayOf", () => {
  it("returns the same day for a Monday (at 00:00)", () => {
    const mon = new Date(2026, 6, 27); // Mon 27 Jul 2026
    const r = mondayOf(mon);
    expect(r.getFullYear()).toBe(2026);
    expect(r.getMonth()).toBe(6);
    expect(r.getDate()).toBe(27);
    expect(r.getHours()).toBe(0);
  });

  it("rolls back to Monday from mid-week", () => {
    const thu = new Date(2026, 6, 30); // Thu 30 Jul
    expect(mondayOf(thu).getDate()).toBe(27);
  });

  it("treats Sunday as belonging to the week that started the previous Monday", () => {
    const sun = new Date(2026, 7, 2); // Sun 2 Aug
    const r = mondayOf(sun);
    expect(r.getMonth()).toBe(6); // July
    expect(r.getDate()).toBe(27);
  });
});

describe("recentMondays", () => {
  it("returns N Mondays newest-first, 7 days apart", () => {
    const from = new Date(2026, 6, 30); // Thu 30 Jul
    const out = recentMondays(3, from);
    expect(out).toHaveLength(3);
    expect(out.map((d) => d.getDate())).toEqual([27, 20, 13]);
  });

  it("returns an empty list for count 0", () => {
    expect(recentMondays(0, new Date(2026, 6, 30))).toEqual([]);
  });
});

describe("mondaysBetween", () => {
  it("is inclusive of both ends (ascending)", () => {
    const start = new Date(2026, 6, 13); // Mon 13 Jul
    const end = new Date(2026, 6, 27); // Mon 27 Jul
    const out = mondaysBetween(start, end);
    expect(out.map((d) => d.getDate())).toEqual([13, 20, 27]);
  });

  it("returns a single Monday when start and end are the same week", () => {
    const d = new Date(2026, 6, 29); // Wed
    const out = mondaysBetween(d, d);
    expect(out).toHaveLength(1);
    expect(out[0].getDate()).toBe(27);
  });
});

describe("isoDate", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(isoDate(new Date(Date.UTC(2026, 6, 5)))).toBe("2026-07-05");
  });
});
