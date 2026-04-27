import * as Bun from "bun";
import { isPointInPolygon, type Point, type Polygon } from "./geometry";
import { getConfig } from "./config";

interface GeoLocation {
  latitude: number;
  longitude: number;
}

interface ConditionalIntensity {
  level: number;
  label: string;
}

export enum ConvectiveForecastType {
  Categorical = "cat",
  Tornado = "torn",
  Hail = "hail",
  Wind = "wind",
}

interface GeoJSONForecastProperties {
  DN: number;
  VALID: string;
  EXPIRE: string;
  ISSUE: string;
  LABEL: string;
  LABEL2: string;
  stroke: string;
  fill: string;
}

type GeoJSONForecast = GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  GeoJSONForecastProperties
>;

const CategoryLevel = {
  NONE: -1,
  TSTM: 0,
  MRGL: 1,
  SLGT: 2,
  ENH: 3,
  MDT: 4,
  HIGH: 5,
} as const;

type CategoryID = keyof typeof CategoryLevel;
type CategoryRiskLevel = (typeof CategoryLevel)[CategoryID];

interface CategoryDetails {
  id: CategoryID;
  riskLevel: CategoryRiskLevel;
  name: string;
  description: string;
  color: string;
}

const productBaseUrl = new URL("https://www.spc.noaa.gov");
const config = getConfig();

export const CategoryOutlook: Record<CategoryID, CategoryDetails> = {
  NONE: {
    id: "NONE",
    riskLevel: -1,
    name: "None",
    description: "No severe weather expected.",
    color: "#f0f0f0",
  },
  TSTM: {
    id: "TSTM",
    riskLevel: 0,
    name: "general thunderstorms",
    description: "General thunderstorms. <10% probability of severe.",
    color: "#c1e9c1",
  },
  MRGL: {
    id: "MRGL",
    riskLevel: 1,
    name: "marginal risk",
    description:
      "An area of severe storms of either limited organization and longevity, or very low coverage and marginal intensity.",
    color: "#66a366",
  },
  SLGT: {
    id: "SLGT",
    riskLevel: 2,
    name: "slight risk",
    description:
      "An area of severe storms expected to be more scattered in coverage and/or not as organized.",
    color: "#ffe066",
  },
  ENH: {
    id: "ENH",
    riskLevel: 3,
    name: "enhanced risk",
    description:
      "An area of severe storms with numerous severe storms possible with varying levels of intensity.",
    color: "#ffa366",
  },
  MDT: {
    id: "MDT",
    riskLevel: 4,
    name: "moderate risk",
    description:
      "An area where widespread severe weather with several tornadoes and/or numerous severe thunderstorms is likely, some of which should be intense. This risk is usually reserved for days with several supercells producing intense tornadoes and/or very large hail, or an intense squall line with widespread damaging winds.",
    color: "#e06666",
  },
  HIGH: {
    id: "HIGH",
    riskLevel: 5,
    name: "high risk",
    description:
      "An area where a severe weather outbreak is expected from either numerous intense and long-tracked tornadoes or a long-lived derecho-producing thunderstorm complex that produces hurricane-force wind gusts and widespread damage. This risk is reserved for when high confidence exists in widespread coverage of severe weather with embedded instances of extreme severe (i.e., violent tornadoes or very damaging convective wind events).",
    color: "#ee99ee",
  },
};

async function fetchForecast(
  day: 1 | 2 | 3,
  type: ConvectiveForecastType,
): Promise<GeoJSONForecast> {
  if (config.useLocalForecastFiles) {
    return fetchForecastFromTestFile(day, type);
  }

  const url = new URL(
    `/products/outlook/day${day}otlk_${type}.lyr.geojson`,
    productBaseUrl,
  );

  const response = await fetch(url);
  return response.json();
}

// For local file-based testing
async function fetchForecastFromTestFile(
  _day: 1 | 2 | 3,
  type: ConvectiveForecastType,
): Promise<GeoJSONForecast> {
  const file = Bun.file(
    `./test-files/day1otlk_20210325_1630_${type}.lyr.geojson`,
  );
  return file.json();
}

function findOutlookForLocation(
  location: GeoLocation,
  forecast: GeoJSONForecast,
): GeoJSONForecastProperties | undefined {
  const locationPoint: Point = [location.longitude, location.latitude];

  // Historically the SPC used the label "SIGN" to indicate a significant
  // hazard.  The new format replaces this with CIG1‑CIG3 labels, which can be
  // found in the same `LABEL` property.  The function no longer filters out
  // features; we simply iterate over all features in reverse order (most
  // recent first) to find the first feature that contains the point.
  const features = forecast.features.toReversed();

  for (const feature of features) {
    const polygon = feature.geometry;

    if (
      polygon.type === "Polygon" &&
      isPointInPolygon(polygon.coordinates[0] as Polygon, locationPoint)
    ) {
      return feature.properties;
    }

    if (polygon.type === "MultiPolygon") {
      for (const coordinates of polygon.coordinates) {
        if (isPointInPolygon(coordinates[0] as Polygon, locationPoint)) {
          return feature.properties;
        }
      }
    }
  }

  return undefined;
}

function isRiskCategory(value?: string): value is keyof typeof CategoryOutlook {
  return typeof value === "string" && value in CategoryOutlook;
}

export function getRiskCategory(
  value?: string,
): (typeof CategoryOutlook)[keyof typeof CategoryOutlook] {
  if (isRiskCategory(value)) {
    return CategoryOutlook[value];
  }

  return CategoryOutlook.NONE;
}

/**
 * Convert a forecast label to a ConditionalIntensity object.
 * Returns null if the label is not a supported CIG value.
 */
export function getConditionalIntensity(
  label: string | undefined,
  hazard: "tornado" | "hail" | "wind",
): ConditionalIntensity | undefined {
  const prefix = "CIG";

  if (!label?.startsWith(prefix)) {
    return;
  }

  const level = parseInt(label.slice(prefix.length));

  if (isNaN(level)) {
    return;
  }

  // Hail forecasts only support CIG1 and CIG2
  if (hazard === "hail" && level > 2) {
    return;
  }

  return { level, label };
}

export async function fetchForecastForPoint(
  day: 1 | 2 | 3,
  type: ConvectiveForecastType,
  location: GeoLocation,
): Promise<string | undefined> {
  const forecast = await fetchForecast(day, type);
  const properties = findOutlookForLocation(location, forecast);

  return properties?.LABEL;
}
