import { cosmiconfig } from 'cosmiconfig';
import { CONFIG_MODULE_NAME } from '../consts';
import Ajv from 'ajv';
import betterAjvErrors from 'better-ajv-errors';

import { PossibleUserSettings, ResolvedSettings, FeaturesSettings, ScreenshotsSettings } from './interfaces';
import debug from 'debug';
// The schema is generated from ts interfaces by running yarn generate-settings-json-schema
import userSettingsSchema from './schemas.json';
import { malformedConfigFile } from '../userFacingStrings/userFacingStrings';

const logger = debug('root-cause:user-settings');

export async function loadSettings(startFrom?: string): Promise<ResolvedSettings> {
  const configFromFile = await readUserConfigFromFile(startFrom);

  return resolveSettings(configFromFile || {});
}

export async function readUserConfigFromFile(startFrom?: string): Promise<PossibleUserSettings | null> {
  const ajvInstance = new Ajv({ allErrors: true, jsonPointers: true });
  try {
    const result = await cosmiconfig(CONFIG_MODULE_NAME, {
      transform(result) {
        return result;
      },
    }).search(startFrom);

    if (!result || result.isEmpty) {
      logger('config file was empty');
      logger('file path ', result?.filepath);
      return null;
    }

    logger('Found config file', result?.filepath);

    const valid = ajvInstance.validate(userSettingsSchema, result.config);

    if (!valid) {
      // We may consider here to fail the invocation and not fallback to default config
      // eslint-disable-next-line no-console
      console.warn(malformedConfigFile());
      const betterErrors = betterAjvErrors(userSettingsSchema, result.config, ajvInstance.errors);
      // eslint-disable-next-line no-console
      console.log(betterErrors);
      // eslint-disable-next-line no-console
      console.log('-'.repeat(5));
    }

    return result.config;
  } catch (configSearchError) {
    // We may consider here to fail the invocation and not fallback to default config
    logger('cosmiconfig error', configSearchError);
    return null;
  }
}

export function resolveSettings(input: PossibleUserSettings): ResolvedSettings {
  const screenshots = resolveScreenshots(input.features?.screenshots);
  const networkLogs = input.features?.networkLogs ?? false;

  const features: ResolvedSettings['features'] = {
    screenshots,
    console: input.features?.console ? input.features?.console : true,
    networkLogs,
    jestAssertions: input.features?.jestAssertions ? input.features?.jestAssertions : false,
  };

  return {
    features,
  };
}

function resolveScreenshots(input: FeaturesSettings['screenshots']): false | Required<ScreenshotsSettings> {
  if (input === true || input === undefined) {
    return {
      format: 'jpeg',
      quality: 85,
      fullPage: false,
    };
  }

  if (input === false) {
    return false;
  }

  return {
    quality: 85,
    fullPage: false,
    ...input,
  };
}

// function resolveNetworkLogs(input: FeaturesSettings['networkLogs']): false | Required<NetworkLogsSettings> {
//     if (input === undefined) {
//         return {
//             includeResponseBody: false,
//         };
//     }

//     if (input === false) {
//         return false;
//     }

//     if (input === true) {
//         return {
//             includeResponseBody: true,
//         };
//     }

//     return {
//         includeResponseBody: input.includeResponseBody ?? false,
//     };
// }
