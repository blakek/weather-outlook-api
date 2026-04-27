// import * as Bun from "bun";
import { getConfig } from "./config";
import { isPointInPolygon, type Point, type Polygon } from "./geometry";

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

interface ConvectiveForecastResult {
  category: CategoryDetails;
}

interface ProbabilityForecastResult {
  probability: number;
  conditionalIntensity?: ConditionalIntensity;
}

type ForecastResult<T extends ConvectiveForecastType = ConvectiveForecastType> =
  T extends ConvectiveForecastType.Categorical
    ? ConvectiveForecastResult
    : T extends
          | ConvectiveForecastType.Tornado
          | ConvectiveForecastType.Hail
          | ConvectiveForecastType.Wind
      ? ProbabilityForecastResult
      : never;

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

// // For local file-based testing
// async function fetchForecastFromTestFile(
//   _day: 1 | 2 | 3,
//   type: ConvectiveForecastType,
// ): Promise<GeoJSONForecast> {
//   const file = Bun.file(
//     `./test-files/day1otlk_20210325_1630_${type}.lyr.geojson`,
//   );
//   return file.json();
// }

function containsPoint(
  geometry: GeoJSONForecast["features"][number]["geometry"],
  point: Point,
): boolean {
  if (geometry.type === "Polygon") {
    return isPointInPolygon(geometry.coordinates[0] as Polygon, point);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((coordinates) =>
      isPointInPolygon(coordinates[0] as Polygon, point),
    );
  }

  return false;
}

function findOutlookForLocation<T extends ConvectiveForecastType>(
  location: GeoLocation,
  forecastType: T,
  forecast: GeoJSONForecast,
): ForecastResult<T> {
  const locationPoint: Point = [location.longitude, location.latitude];
  let candidates: GeoJSONForecastProperties[] = [];

  for (const feature of forecast.features) {
    if (!containsPoint(feature.geometry, locationPoint)) {
      continue;
    }

    if (
      forecastType === ConvectiveForecastType.Categorical &&
      !isRiskCategory(feature.properties.LABEL)
    ) {
      continue;
    }

    candidates.push(feature.properties);
  }

  if (candidates.length === 0) {
    return getDefaultForecastResult(forecastType);
  }

  if (forecastType === ConvectiveForecastType.Categorical) {
    const best = getBestMatch(candidates);
    return {
      category:
        CategoryOutlook[best?.LABEL as CategoryID] || CategoryOutlook.NONE,
    } as ForecastResult<T>;
  }

  // Separate probability and conditional intensity candidates for probabilistic forecasts
  const [probabilityCandidates, conditionalIntensityCandidates] = partition(
    candidates,
    (c) => !isNaN(Number(c.LABEL)),
  );

  const bestProbability = getBestMatch(probabilityCandidates);
  const bestConditionalIntensity = getBestMatch(conditionalIntensityCandidates);

  return {
    probability: Number(bestProbability?.LABEL) || 0,
    conditionalIntensity: getConditionalIntensity(
      bestConditionalIntensity?.LABEL,
    ),
  } as ForecastResult<T>;
}

export type MapFn<T, U> = (value: T, index: number, array: T[]) => U;

function partition<T>(
  iterable: Iterable<T>,
  fn: MapFn<T, boolean>,
): [T[], T[]] {
  return Array.from(iterable).reduce<[T[], T[]]>(
    (accum, value, index, self) => {
      const resultIndex = fn(value, index, self) ? 0 : 1;
      accum[resultIndex].push(value);
      return accum;
    },
    [[], []],
  );
}

function getDefaultForecastResult<T extends ConvectiveForecastType>(
  type: T,
): ForecastResult<T> {
  if (type === ConvectiveForecastType.Categorical) {
    return {
      category: CategoryOutlook.NONE,
    } as ForecastResult<T>;
  }

  return {
    probability: 0,
  } as ForecastResult<T>;
}

/**
 * Gets the best match between two forecast properties based on the forecast type.
 * Only works with properties of the same type (e.g. probabilistic or categorical).
 */
function getBestMatch(
  properties: GeoJSONForecastProperties[],
): GeoJSONForecastProperties | undefined {
  let best: GeoJSONForecastProperties | undefined;

  for (const candidate of properties) {
    if (!best || candidate.DN > best.DN) {
      best = candidate;
    }
  }

  return best;
}

function isRiskCategory(value?: string): value is keyof typeof CategoryOutlook {
  return typeof value === "string" && value in CategoryOutlook;
}

/**
 * Convert a forecast label to a ConditionalIntensity object.
 * Returns null if the label is not a supported CIG value.
 */
export function getConditionalIntensity(
  label: string | undefined,
): ConditionalIntensity | undefined {
  const prefix = "CIG";

  if (!label?.startsWith(prefix)) {
    return;
  }

  const level = parseInt(label.slice(prefix.length));

  if (isNaN(level)) {
    return;
  }

  return { level, label };
}

export async function fetchForecastForPoint<T extends ConvectiveForecastType>(
  day: 1 | 2 | 3,
  type: T,
  location: GeoLocation,
): Promise<ForecastResult<T>> {
  const forecast = await fetchForecast(day, type);
  return findOutlookForLocation(location, type, forecast);
}
