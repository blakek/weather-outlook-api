import { isPointInPolygon, type Point, type Polygon } from "./geometry";

interface GeoLocation {
  latitude: number;
  longitude: number;
}

export enum ConvectiveForecastType {
  Categorical = "cat",
  Tornado = "torn",
  SignificantTornado = "sigtorn",
  Hail = "hail",
  SignificantHail = "sighail",
  Wind = "wind",
  SignificantWind = "sigwind",
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
  const url = new URL(
    `/products/outlook/day${day}otlk_${type}.lyr.geojson`,
    productBaseUrl,
  );

  const response = await fetch(url);
  return response.json();
}

// For local file-based testing
// async function fetchForecast(
//   _day: 1 | 2 | 3,
//   type: ConvectiveForecastType,
// ): Promise<GeoJSONForecast> {
//   const file = Bun.file(
//     `./test-files/day1otlk_20210325_1630_${type}.lyr.geojson`,
//   );
//   return file.json();
// }

function findOutlookForLocation(
  location: GeoLocation,
  forecast: GeoJSONForecast,
  getSignificant = false,
): GeoJSONForecastProperties | undefined {
  const locationPoint: Point = [location.longitude, location.latitude];

  const features = forecast.features
    .filter((f) =>
      getSignificant
        ? f.properties.LABEL === "SIGN"
        : f.properties.LABEL !== "SIGN",
    )
    .reverse();

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

export async function fetchForecastForPoint(
  day: 1 | 2 | 3,
  type: ConvectiveForecastType,
  location: GeoLocation,
): Promise<string | undefined> {
  const forecast = await fetchForecast(day, type);
  const isCheckingForSignificant =
    type === ConvectiveForecastType.SignificantHail ||
    type === ConvectiveForecastType.SignificantTornado ||
    type === ConvectiveForecastType.SignificantWind;

  const properties = findOutlookForLocation(
    location,
    forecast,
    isCheckingForSignificant,
  );

  return properties?.LABEL;
}
