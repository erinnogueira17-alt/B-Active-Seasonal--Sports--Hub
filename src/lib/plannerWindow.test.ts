import { describe, it, expect } from "vitest";
import { getWindowStatus } from "./plannerWindow";

const TERM_START = new Date(2026, 0, 1); // 1 Jan 2026

describe("getWindowStatus", () => {
  it("is season_ended when SEASON_OPEN is false", () => {
    const status = getWindowStatus(new Date(2026, 6, 26), false, TERM_START);
    expect(status.state).toBe("season_ended");
  });

  it("is not_started before TERM_START", () => {
    const status = getWindowStatus(new Date(2025, 11, 1), true, TERM_START);
    expect(status.state).toBe("not_started");
  });

  it("is open on Sunday with monday = tomorrow", () => {
    // 26 July 2026 is a Sunday
    const status = getWindowStatus(new Date(2026, 6, 26, 10, 0), true, TERM_START);
    expect(status.state).toBe("open");
    if (status.state === "open") {
      expect(status.sunday.getDate()).toBe(26);
      expect(status.monday.getDate()).toBe(27);
    }
  });

  it("is open on Monday with sunday = yesterday", () => {
    // 27 July 2026 is a Monday
    const status = getWindowStatus(new Date(2026, 6, 27, 8, 0), true, TERM_START);
    expect(status.state).toBe("open");
    if (status.state === "open") {
      expect(status.monday.getDate()).toBe(27);
      expect(status.sunday.getDate()).toBe(26);
    }
  });

  it("is closed midweek and points to the next Sunday", () => {
    // 29 July 2026 is a Wednesday → next Sunday is 2 Aug
    const status = getWindowStatus(new Date(2026, 6, 29, 12, 0), true, TERM_START);
    expect(status.state).toBe("closed");
    if (status.state === "closed") {
      expect(status.nextSunday.getMonth()).toBe(7); // August
      expect(status.nextSunday.getDate()).toBe(2);
    }
  });
});
