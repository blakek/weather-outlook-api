import {
  ConvectiveForecastType,
  fetchForecastForPoint,
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
    If there is a >=10% probability of an EF2+ tornado within 25 miles of a point
    """
    hasSignificantTornadoRisk: Boolean!

    """
    Probability of hail >=1" in diameter occurring within 25 miles of the location.
    """
    hailProbability: Float!

    """
    If there is a >=10% probability of hail >=2" in diameter within 25 miles of a point
    """
    hasSignificantHailRisk: Boolean!

    """
    Probability of wind gusts >=58 mph occurring within 25 miles of the location.
    """
    windProbability: Float!

    """
    If there is a >=10% probability of wind gusts >=75 mph within 25 miles of a point
    """
    hasSignificantWindRisk: Boolean!
  }

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
      return fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.Tornado,
        parent.location,
      );
    },

    hasSignificantTornadoRisk: async (parent: ConvectiveOutlookArgs) => {
      const forecast = await fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.SignificantTornado,
        parent.location,
      );

      return forecast === "SIGN";
    },

    hailProbability: async (parent: ConvectiveOutlookArgs) => {
      return fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.Hail,
        parent.location,
      );
    },

    hasSignificantHailRisk: async (parent: ConvectiveOutlookArgs) => {
      const forecast = await fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.SignificantHail,
        parent.location,
      );

      return forecast === "SIGN";
    },

    windProbability: async (parent: ConvectiveOutlookArgs) => {
      return fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.Wind,
        parent.location,
      );
    },

    hasSignificantWindRisk: async (parent: ConvectiveOutlookArgs) => {
      const forecast = await fetchForecastForPoint(
        parent.day,
        ConvectiveForecastType.SignificantWind,
        parent.location,
      );

      return forecast === "SIGN";
    },
  },

  Query: {
    convectiveOutlook: (_: never, args: { location: GeoLocation }) => {
      // Allow the nested resolvers to handle the data
      return {
        day1: {
          day: 1,
          location: args.location,
        },
        day2: {
          day: 2,
          location: args.location,
        },
        day3: {
          day: 3,
          location: args.location,
        },
      };
    },
  },
};
