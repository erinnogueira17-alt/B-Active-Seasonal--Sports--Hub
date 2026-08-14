import { describe, it, expect } from "vitest";
import { verifyCoachPin, normalizeCoachName, coachEmail, COACH_PIN } from "./coachAccess.js";

describe("verifyCoachPin", () => {
  it("accepts the shared code (trimming whitespace)", () => {
    expect(verifyCoachPin(COACH_PIN)).toBe(true);
    expect(verifyCoachPin(`  ${COACH_PIN}  `)).toBe(true);
  });
  it("rejects anything else", () => {
    expect(verifyCoachPin("0000")).toBe(false);
    expect(verifyCoachPin("")).toBe(false);
  });
});

describe("normalizeCoachName", () => {
  it("trims and single-spaces the parts and builds a display name", () => {
    expect(normalizeCoachName("  Daniel ", "  Mann ")).toEqual({
      first: "Daniel",
      surname: "Mann",
      display: "Daniel Mann",
    });
    expect(normalizeCoachName("Mary  Jane", "Van  Wyk").display).toBe("Mary Jane Van Wyk");
  });
});

describe("coachEmail", () => {
  it("builds a stable synthetic email from the name", () => {
    expect(coachEmail("Daniel", "Mann")).toBe("daniel.mann@coach.hub");
    expect(coachEmail("Mary Jane", "Van Wyk")).toBe("mary.jane.van.wyk@coach.hub");
  });

  it("is case-insensitive and strips punctuation so the same person maps to one account", () => {
    expect(coachEmail("DANIEL", "mann")).toBe("daniel.mann@coach.hub");
    expect(coachEmail("  Daniel ", " O'Brien ")).toBe("daniel.o.brien@coach.hub");
  });
});
