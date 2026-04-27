import { describe, it, expect, vi, afterEach } from "vitest";
import { resolvers } from "../src/schema";
import * as spc from "../src/spc";

// Helper location used for all tests
const testLocation = { latitude: 35, longitude: -85 } as const;

describe("Conditional Intensity and probability parsing", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns numeric probability when forecast is a number", async () => {
    vi.spyOn(spc, "fetchForecastForPoint").mockResolvedValueOnce("45");
    const prob = await resolvers.DetailedConvectiveOutlook.tornadoProbability({
      day: 1,
      location: testLocation,
    });
    expect(prob).toBe(45);
  });

  it("returns undefined when forecast is non-numeric (e.g., CIG)", async () => {
    vi.spyOn(spc, "fetchForecastForPoint").mockResolvedValueOnce("CIG2");
    const prob = await resolvers.DetailedConvectiveOutlook.tornadoProbability({
      day: 1,
      location: testLocation,
    });
    expect(prob).toBeUndefined();
  });

  it("parses CIG labels into ConditionalIntensity correctly", async () => {
    vi.spyOn(spc, "fetchForecastForPoint").mockResolvedValueOnce("CIG3");
    const ci =
      await resolvers.DetailedConvectiveOutlook.tornadoConditionalIntensity({
        day: 1,
        location: testLocation,
      });
    expect(ci).toEqual({ level: 3, label: "CIG3" });
  });

  it("ignores unsupported CIG levels for hail (CIG3 returns undefined)", async () => {
    vi.spyOn(spc, "fetchForecastForPoint").mockResolvedValueOnce("CIG3");
    const ci =
      await resolvers.DetailedConvectiveOutlook.hailConditionalIntensity({
        day: 1,
        location: testLocation,
      });
    expect(ci).toBeUndefined();
  });

  it("returns undefined when forecast is undefined", async () => {
    vi.spyOn(spc, "fetchForecastForPoint").mockResolvedValueOnce(undefined);
    const prob = await resolvers.DetailedConvectiveOutlook.windProbability({
      day: 1,
      location: testLocation,
    });
    expect(prob).toBeUndefined();
  });
});
