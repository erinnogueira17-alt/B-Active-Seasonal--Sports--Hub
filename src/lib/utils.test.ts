import { describe, it, expect } from "vitest";
import { sportEmoji, formatBytes, labelFromFilename, formatDate } from "./utils";

describe("sportEmoji", () => {
  it("maps hockey before the generic fallback (case-insensitive)", () => {
    expect(sportEmoji("u10 Boys HOCKEY")).toBe("🏑");
    expect(sportEmoji("Mini Hockey R-1")).toBe("🏑");
  });

  it("maps common sports", () => {
    expect(sportEmoji("Football")).toBe("⚽");
    expect(sportEmoji("Boys Soccer")).toBe("⚽");
    expect(sportEmoji("Touch Rugby")).toBe("🏉");
    expect(sportEmoji("2nd Team Cricket")).toBe("🏏");
    expect(sportEmoji("HS Netball")).toBe("🏐");
    expect(sportEmoji("Mini Athletics")).toBe("🏃");
    expect(sportEmoji("GR4-9 Tennis")).toBe("🎾");
    expect(sportEmoji("Swimming")).toBe("🏊");
    expect(sportEmoji("Table Tennis")).toBe("🏓");
  });

  it("checks table tennis before tennis", () => {
    expect(sportEmoji("Table Tennis")).toBe("🏓");
    expect(sportEmoji("Tennis")).toBe("🎾");
  });

  it("falls back to a medal", () => {
    expect(sportEmoji("Oversee all sport")).toBe("🏅");
    expect(sportEmoji("")).toBe("🏅");
    expect(sportEmoji(null)).toBe("🏅");
  });
});

describe("formatBytes", () => {
  it("formats sizes", () => {
    expect(formatBytes(0)).toBe("—");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("handles GB and nullish input", () => {
    expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe("3.0 GB");
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(undefined)).toBe("—");
    expect(formatBytes(-5)).toBe("—");
  });
});

describe("labelFromFilename", () => {
  it("turns an uploaded filename into a readable label", () => {
    expect(labelFromFilename("Coach_Daniel_-_Colin_Mann_Football.jpg")).toBe(
      "Coach Daniel – Colin Mann Football",
    );
  });

  it("drops the extension and the ' (1)' dedupe suffix", () => {
    expect(labelFromFilename("team photo (1).png")).toBe("team photo");
    expect(labelFromFilename("Fixtures.pdf")).toBe("Fixtures");
  });

  it("returns an empty string for missing names", () => {
    expect(labelFromFilename(null)).toBe("");
    expect(labelFromFilename(undefined)).toBe("");
    expect(labelFromFilename("")).toBe("");
  });
});

describe("formatDate", () => {
  it("accepts both Date objects and ISO strings", () => {
    const asDate = formatDate(new Date(2026, 6, 27));
    const asString = formatDate("2026-07-27T00:00:00");
    expect(asDate).toBe(asString);
    expect(asDate).toMatch(/27/);
  });
});
