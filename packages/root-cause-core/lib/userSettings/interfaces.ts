export interface PossibleUserSettings {
  features?: FeaturesSettings;
}

export interface FeaturesSettings {
  /**
   * Take screenshot for every step
   *
   * Default to true, with jpeg 85
   */
  screenshots?: boolean | ScreenshotsSettings;

  /**
   * Record the browser's console
   *
   * @default true
   */
  console?: boolean;

  /**
   * Record network activity, make it available in the UI and as har file
   */
  networkLogs?: boolean;

  /**
   * When using jest integration, record jest expect calls as assertion steps
   */
  jestAssertions?: boolean;
}

export interface ResolvedSettings {
  features: {
    screenshots: false | Required<ScreenshotsSettings>;
    console: boolean;
    networkLogs: boolean;
    jestAssertions: boolean;
  };
}

export interface ScreenshotsSettings {
  format: 'png' | 'jpeg';

  /**
   * Quality of jpeg image, from 1 to 100
   *
   * @default 85
   */
  quality?: number;

  /**
   * When true, takes a screenshot of the full scrollable page, instead of the currently visible
   *
   * @default false
   */
  fullPage?: boolean;
}

type ContentType = string;

/**
 * placeholder, not in use yet
 */
export interface NetworkLogsSettings {
  /**
   * Save the response bodies into the har file, or only for specific content types
   *
   * @default false
   */
  includeResponseBody?: boolean | ContentType[];
}
