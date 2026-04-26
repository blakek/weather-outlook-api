import { describe, expect, it } from "bun:test";
import { parseBooleanEnv } from "./config";

describe("parseBooleanEnv", () => {
  it("returns default value when input is undefined", () => {
    expect(parseBooleanEnv(undefined, true)).toBe(true);
    expect(parseBooleanEnv(undefined, false)).toBe(false);
  });

  it("returns default value when input is empty string", () => {
    expect(parseBooleanEnv("", true)).toBe(true);
    expect(parseBooleanEnv("", false)).toBe(false);
  });

  it("returns false for falsy string values", () => {
    const falsyValues = ["false", "0", "no", "off"];
    falsyValues.forEach((val) => {
      expect(parseBooleanEnv(val, true)).toBe(false);
      expect(parseBooleanEnv(val.toUpperCase(), true)).toBe(false); // Case-insensitive
    });
  });

  it("returns true for any other non-empty string", () => {
    expect(parseBooleanEnv("true", false)).toBe(true);
    expect(parseBooleanEnv("    yes", false)).toBe(true);
    expect(parseBooleanEnv("1", false)).toBe(true);
    expect(parseBooleanEnv("on", false)).toBe(true);
  });
});
