export interface Config {
  useLocalForecastFiles: boolean;
}

const booleanFalsyValues = new Set(["false", "0", "no", "off"]);

export function parseBooleanEnv(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  if (booleanFalsyValues.has(value.toLowerCase())) {
    return false;
  }

  return Boolean(value);
}

const _config: Config | undefined;

export function getConfig(): Config {
  const useLocalForecastFiles = parseBooleanEnv(
    process.env.USE_LOCAL_FORECAST_FILES,
    false,
  );

  return {
    useLocalForecastFiles,
  };
}
