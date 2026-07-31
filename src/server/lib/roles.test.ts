import { describe, it, expect } from "vitest";
import { isBootstrapAdmin } from "./roles.js";

describe("isBootstrapAdmin", () => {
  it("makes the very first account an admin", () => {
    expect(isBootstrapAdmin(0, undefined, "anyone@example.com")).toBe(true);
    expect(isBootstrapAdmin(0, "someone@else.com", "anyone@example.com")).toBe(true);
  });

  it("is not admin for later accounts when no ADMIN_EMAIL is set", () => {
    expect(isBootstrapAdmin(5, undefined, "coach@example.com")).toBe(false);
    expect(isBootstrapAdmin(1, "", "coach@example.com")).toBe(false);
  });

  it("promotes a later account only when its email matches ADMIN_EMAIL", () => {
    expect(isBootstrapAdmin(3, "boss@bactive.com", "boss@bactive.com")).toBe(true);
    expect(isBootstrapAdmin(3, "boss@bactive.com", "coach@bactive.com")).toBe(false);
  });

  it("matches ADMIN_EMAIL case-insensitively and ignores surrounding spaces", () => {
    expect(isBootstrapAdmin(3, "  Boss@Bactive.com  ", "boss@bactive.com")).toBe(true);
    expect(isBootstrapAdmin(3, "BOSS@BACTIVE.COM", "boss@bactive.com")).toBe(true);
  });
});
