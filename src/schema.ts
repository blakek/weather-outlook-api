import { createSchema } from "graphql-yoga";
import {
  ConvectiveForecastType,
  fetchForecastForPoint,
  getConditionalIntensity,
  getRiskCategory,
} from "./spc";

export const typeDefs = /* GraphQL */ `
  type RiskCategory {
    """
    The identifier for the category from the SPC or "NONE" (e.g. "NONE", "MRGL", "SLGT", "ENH", "MDT", "HIGH").
    """
    id: ID!

    """
    The risk level of the category from -1 to 5.
    -1 is no risk, 0 is general thunderstorms, 1 is marginal risk, 2 is slight risk, 3 is enhanced risk, 4 is moderate risk, and 5 is high risk.
    """
    riskLevel: Int!

    """
    A readable name for the category.
    """
    name: String!

    """
    A description of the category.
    """
    description: String!

    """
    A suggested color for the category in hex format.
    """
    color: String!
  }

  input LocationInput {
    latitude: Float!
    longitude: Float!
  }

  type Location {
    latitude: Float!
    longitude: Float!
  }

  type ConvectiveOutlook {
    """
    The day of the forecast. 1 is today, 2 is tomorrow, 3 is the day after tomorrow.
    """
    day: Int!

    """
    Location of the forecast.
    """
    location: Location!

    """
    The categorical forecast for the day.
    """
    riskCategory: RiskCategory!
  }

  type DetailedConvectiveOutlook {
    """
    The day of the forecast. 1 is today, 2 is tomorrow, 3 is the day after tomorrow.
    """
    day: Int!

    """
    Location of the forecast.
    """
    location: Location!

    """
    The categorical forecast for the day.
    """
    riskCategory: RiskCategory!

    """
    Probability of a tornado occurring within 25 miles of the location.
    """
    tornadoProbability: Float!

    """
    Conditional intensity for tornado hazards.
    """
    tornadoConditionalIntensity: ConditionalIntensity

    """
    Probability of hail >=1" in diameter occurring within 25 miles of the location.
    """
    hailProbability: Float!

    """
    Conditional intensity for hail hazards.
    """
    hailConditionalIntensity: ConditionalIntensity

    """
    Probability of wind gusts >=58 mph occurring within 25 miles of the location.
    """
    windProbability: Float!

    """
    Conditional intensity for wind hazards.
    """
    windConditionalIntensity: ConditionalIntensity
  }

  # -----------------------------------------------------------------------
  # Conditional intensity types
  # -----------------------------------------------------------------------
  type ConditionalIntensity {
    """
    The intensity level of the conditional intensity group.
    """
    level: Int!
    """
    The original label string from the forecast data (e.g., "CIG2").
    """
    label: String!
  }

  # The DetailedConvectiveOutlook type is defined above with the new fields.

  type ConvectiveOutlookDays {
    day1: DetailedConvectiveOutlook!
    day2: DetailedConvectiveOutlook!
    day3: ConvectiveOutlook!
  }

  type Query {
    convectiveOutlook(location: LocationInput!): ConvectiveOutlookDays!
  }
`;

interface GeoLocation {
  latitude: number;
  longitude: number;
}

interface ConvectiveOutlookArgs {
  day: 1 | 2 | 3;
  location: GeoLocation;
}

export const resolvers = {
  ConvectiveOutlook: {
    riskCategory: async (parent: ConvectiveOutlookArgs) => {
      const forecast = await fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.Categorical,
        parent.location,
      );

      return getRiskCategory(forecast);
    },
  },

  DetailedConvectiveOutlook: {
    riskCategory: async (parent: ConvectiveOutlookArgs) => {
      const forecast = await fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.Categorical,
        parent.location,
      );
      return getRiskCategory(forecast);
    },

    tornadoProbability: async (parent: ConvectiveOutlookArgs) => {
      const forecast = await fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.Tornado,
        parent.location,
      );

      return Number(forecast) || 0;
    },

    tornadoConditionalIntensity: async (parent: ConvectiveOutlookArgs) => {
      const forecast = await fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.Tornado,
        parent.location,
      );
      return getConditionalIntensity(forecast, "tornado");
    },

    hailProbability: async (parent: ConvectiveOutlookArgs) => {
      const forecast = await fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.Hail,
        parent.location,
      );

      return Number(forecast) || 0;
    },

    hailConditionalIntensity: async (parent: ConvectiveOutlookArgs) => {
      const forecast = await fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.Hail,
        parent.location,
      );
      return getConditionalIntensity(forecast, "hail");
    },

    windProbability: async (parent: ConvectiveOutlookArgs) => {
      const forecast = await fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.Wind,
        parent.location,
      );

      return Number(forecast) || 0;
    },

    windConditionalIntensity: async (parent: ConvectiveOutlookArgs) => {
      const forecast = await fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.Wind,
        parent.location,
      );
      return getConditionalIntensity(forecast, "wind");
    },
  },

  Query: {
    convectiveOutlook: (_: never, args: { location: GeoLocation }) => {
      // Allow the nested resolvers to handle the data
      return {
        day1: { day: 1, location: args.location },
        day2: { day: 2, location: args.location },
        day3: { day: 3, location: args.location },
      };
    },
  },
};

export const schema = createSchema({ typeDefs, resolvers });
