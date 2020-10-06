/* eslint-disable no-var */
import { loadSettings, readUserConfigFromFile } from './userSettings';
import path from 'path';
import {
  getCleanAnsiPrettyFormatPluginFlatString,
  getCleanAllPathsPrettyFormatPlugin,
} from '@testim/internal-self-tests-helpers';

var moduleDefaultFunction: jest.Mock | undefined;
var loggerFunction: jest.Mock | undefined;

jest.mock('debug', () => {
  if (!moduleDefaultFunction) {
    loggerFunction = jest.fn();
    moduleDefaultFunction = jest.fn(() => loggerFunction);
  }

  return {
    __esModule: true,
    default: moduleDefaultFunction,
  };
});

describe('user settings', () => {
  // eslint-disable-next-line no-console
  const mockedConsoleLog = jest.fn(console.log);
  // eslint-disable-next-line no-console
  const mockedConsoleWarn = jest.fn(console.warn);
  const { warn: origConsoleWarn, log: origConsoleLog } = console;
  expect.addSnapshotSerializer(getCleanAnsiPrettyFormatPluginFlatString());
  expect.addSnapshotSerializer(getCleanAllPathsPrettyFormatPlugin(process.cwd()));

  beforeAll(() => {
    // fix an issue with running cosmiconfig inside jest lead to empty modules
    // probably jest bug
    // eslint-disable-next-line import/no-extraneous-dependencies
    const a = require('parse-json');
    a.toString();

    // eslint-disable-next-line no-console
    console.log = mockedConsoleLog;
    // eslint-disable-next-line no-console
    console.warn = mockedConsoleWarn;
  });

  afterAll(() => {
    // eslint-disable-next-line no-console
    console.log = origConsoleLog;
    // eslint-disable-next-line no-console
    console.warn = origConsoleWarn;
  });

  afterEach(() => {
    mockedConsoleLog.mockReset();
    mockedConsoleWarn.mockReset();
    moduleDefaultFunction?.mockReset();
    loggerFunction?.mockReset();
  });

  test('When no config file, get defaults', async () => {
    expect(await loadSettings()).toMatchInlineSnapshot(`
      Object {
        "features": Object {
          "console": true,
          "html": false,
          "jestAssertions": false,
          "networkLogs": true,
          "screenshots": Object {
            "format": "jpeg",
            "fullPage": false,
            "quality": 85,
          },
        },
      }
    `);

    expect(moduleDefaultFunction?.mock.calls).toMatchInlineSnapshot(`
            Array [
              Array [
                "root-cause:user-settings",
              ],
            ]
        `);

    expect(loggerFunction?.mock.calls).toMatchInlineSnapshot(`
            Array [
              Array [
                "config file was empty",
              ],
              Array [
                "file path ",
                undefined,
              ],
            ]
        `);

    expect(mockedConsoleLog).not.toBeCalled();
    expect(mockedConsoleWarn).not.toBeCalled();
  });

  test('When settings file is valid, merge with defaults', async () => {
    expect(await loadSettings(path.resolve(__dirname, './fixtures', 'valid')))
      .toMatchInlineSnapshot(`
      Object {
        "features": Object {
          "console": true,
          "html": false,
          "jestAssertions": true,
          "networkLogs": true,
          "screenshots": false,
        },
      }
    `);

    expect(loggerFunction?.mock.calls).toMatchInlineSnapshot(`
            Array [
              Array [
                "Found config file",
                "noise_removed/packages/root-cause-core/lib/userSettings/fixtures/valid/.root-causerc.json",
              ],
            ]
        `);

    expect(mockedConsoleLog).not.toBeCalled();
    expect(mockedConsoleWarn).not.toBeCalled();
  });

  test('Network logs off in config', async () => {
    expect(await loadSettings(path.resolve(__dirname, './fixtures', 'valid-network-logs-off')))
      .toMatchInlineSnapshot(`
      Object {
        "features": Object {
          "console": true,
          "html": false,
          "jestAssertions": true,
          "networkLogs": false,
          "screenshots": false,
        },
      }
    `);

    expect(loggerFunction?.mock.calls).toMatchInlineSnapshot(`
            Array [
              Array [
                "Found config file",
                "noise_removed/packages/root-cause-core/lib/userSettings/fixtures/valid-network-logs-off/.root-causerc.json",
              ],
            ]
        `);

    expect(mockedConsoleLog).not.toBeCalled();
    expect(mockedConsoleWarn).not.toBeCalled();
  });

  test('When settings file is malformed', async () => {
    expect(await readUserConfigFromFile(path.resolve(__dirname, './fixtures', 'malformed')))
      .toMatchInlineSnapshot(`
            Object {
              "features": Object {
                "another wrong prop": null,
                "networkLogs": true,
                "screenshots": 5,
              },
            }
        `);

    expect(loggerFunction?.mock.calls).toMatchInlineSnapshot(`
            Array [
              Array [
                "Found config file",
                "noise_removed/packages/root-cause-core/lib/userSettings/fixtures/malformed/.root-causerc.json",
              ],
            ]
        `);

    expect(mockedConsoleLog.mock.calls).toMatchInlineSnapshot(`
            Array [
              Array [
                "ADDTIONAL PROPERTY should NOT have additional properties

            > 1 | {\\"features\\":{\\"another wrong prop\\":null,\\"screenshots\\":5,\\"networkLogs\\":true}}
                |              ^^^^^^^^^^^^^^^^^^^^ 😲  another wrong prop is not expected to be here!

            TYPE should be boolean

            > 1 | {\\"features\\":{\\"another wrong prop\\":null,\\"screenshots\\":5,\\"networkLogs\\":true}}
                |                                                      ^ 👈🏽  type should be boolean

            TYPE should be object

            > 1 | {\\"features\\":{\\"another wrong prop\\":null,\\"screenshots\\":5,\\"networkLogs\\":true}}
                |                                                      ^ 👈🏽  type should be object

            ANYOF should match some schema in anyOf

            > 1 | {\\"features\\":{\\"another wrong prop\\":null,\\"screenshots\\":5,\\"networkLogs\\":true}}
                |                                                      ^ 👈🏽  anyOf should match some schema in anyOf",
              ],
              Array [
                "-----",
              ],
            ]
        `);
    expect(mockedConsoleWarn.mock.calls).toMatchInlineSnapshot(`
            Array [
              Array [
                "Root Cause error: malformed config file
            Falling back to default config",
              ],
            ]
        `);
  });
});
