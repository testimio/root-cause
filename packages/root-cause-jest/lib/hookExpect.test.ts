import { hookExpect, MatcherEndResultSync, MatcherEndResultAsync } from './hookExpect';
import {
  getStackCleanStackTracePrettyFormatPlugin,
  getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin,
  getCleanAnsiPrettyFormatPluginObjectWithMessage,
  getCleanAnsiPrettyFormatPluginFlatString,
} from '@testim/internal-self-tests-helpers';

describe('hookExpect', () => {
  expect.addSnapshotSerializer(getStackCleanStackTracePrettyFormatPlugin(process.cwd()));
  expect.addSnapshotSerializer(getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin());
  expect.addSnapshotSerializer(getCleanAnsiPrettyFormatPluginObjectWithMessage());
  expect.addSnapshotSerializer(getCleanAnsiPrettyFormatPluginFlatString());

  let matcherEndHandler = {
    sync: jest.fn((result: MatcherEndResultSync) => {}),
    async: jest.fn(async (result: MatcherEndResultAsync) => {}),
  };

  let matcherStartHandler = jest.fn((...args: any[]) => matcherEndHandler);

  let expectStartHandler = jest.fn((...args: any[]) => matcherStartHandler);

  beforeEach(() => {
    matcherEndHandler = {
      sync: jest.fn(),
      async: jest.fn(),
    };
    matcherStartHandler = jest.fn(() => matcherEndHandler);
    expectStartHandler = jest.fn(() => matcherStartHandler);
  });

  test('simple toBe success', () => {
    const unhook = hookExpect(expectStartHandler);

    expect(1).toBe(1);

    unhook();

    expect(expectStartHandler).toBeCalledTimes(1);
    expect(matcherStartHandler).toBeCalledTimes(1);
    expect(matcherEndHandler.async).toBeCalledTimes(0);
    expect(matcherEndHandler.sync).toBeCalledTimes(1);

    expect(expectStartHandler.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Array [
          1,
        ],
        Error: 
          at Object.<anonymous> (noise_removed/packages/root-cause-jest/lib/hookExpect.test.ts:36:5)
          at Object.asyncJestTest (noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/jasmineAsyncInstall.js:106:37)
          at noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/queueRunner.js:45:12
          at new Promise (<anonymous>)
          at mapper (noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/queueRunner.js:28:19)
          at noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/queueRunner.js:75:41,
      ]
    `);
    expect(matcherStartHandler.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              "toBe",
              Array [
                1,
              ],
              "root",
            ]
        `);
    expect(matcherEndHandler.sync.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              Object {
                "success": true,
              },
            ]
        `);
  });

  test('simple toBe failure', () => {
    const unhook = hookExpect(expectStartHandler);

    try {
      expect(1).toBe(2);
    } catch {
      //
    }

    unhook();

    expect(expectStartHandler).toBeCalledTimes(1);
    expect(matcherStartHandler).toBeCalledTimes(1);
    expect(matcherEndHandler.async).toBeCalledTimes(0);
    expect(matcherEndHandler.sync).toBeCalledTimes(1);

    expect(expectStartHandler.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Array [
          1,
        ],
        Error: 
          at Object.<anonymous> (noise_removed/packages/root-cause-jest/lib/hookExpect.test.ts:81:7)
          at Object.asyncJestTest (noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/jasmineAsyncInstall.js:106:37)
          at noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/queueRunner.js:45:12
          at new Promise (<anonymous>)
          at mapper (noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/queueRunner.js:28:19)
          at noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/queueRunner.js:75:41,
      ]
    `);
    expect(matcherStartHandler.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              "toBe",
              Array [
                2,
              ],
              "root",
            ]
        `);
    expect(matcherEndHandler.sync.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              Object {
                "error": [Error: expect(received).toBe(expected) // Object.is equality

            Expected: 2
            Received: 1],
                "success": false,
              },
            ]
        `);
  });

  test('simple resolves modifier success', async () => {
    const unhook = hookExpect(expectStartHandler);

    await expect(Promise.resolve({ value: 'someValue' })).resolves.toEqual({
      value: 'someValue',
    });

    unhook();

    expect(expectStartHandler).toBeCalledTimes(1);
    expect(matcherStartHandler).toBeCalledTimes(1);
    expect(matcherEndHandler.async).toBeCalledTimes(1);
    expect(matcherEndHandler.sync).toBeCalledTimes(0);

    expect(expectStartHandler.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Array [
          Promise {},
        ],
        Error: 
          at Object.<anonymous> (noise_removed/packages/root-cause-jest/lib/hookExpect.test.ts:132:11)
          at Object.asyncJestTest (noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/jasmineAsyncInstall.js:106:37)
          at noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/queueRunner.js:45:12
          at new Promise (<anonymous>)
          at mapper (noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/queueRunner.js:28:19)
          at noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/queueRunner.js:75:41,
      ]
    `);
    expect(matcherStartHandler.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              "toEqual",
              Array [
                Object {
                  "value": "someValue",
                },
              ],
              "resolves",
            ]
        `);
    expect(matcherEndHandler.async.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              Object {
                "success": true,
              },
            ]
        `);
  });

  test('simple rejects modifier success', async () => {
    const unhook = hookExpect(expectStartHandler);

    await expect(Promise.reject(new Error('someValue'))).rejects.toMatchObject({
      message: 'someValue',
    });

    unhook();

    expect(expectStartHandler).toBeCalledTimes(1);
    expect(matcherStartHandler).toBeCalledTimes(1);
    expect(matcherEndHandler.async).toBeCalledTimes(1);
    expect(matcherEndHandler.sync).toBeCalledTimes(0);

    expect(expectStartHandler.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Array [
          Promise {},
        ],
        Error: 
          at Object.<anonymous> (noise_removed/packages/root-cause-jest/lib/hookExpect.test.ts:180:11)
          at Object.asyncJestTest (noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/jasmineAsyncInstall.js:106:37)
          at noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/queueRunner.js:45:12
          at new Promise (<anonymous>)
          at mapper (noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/queueRunner.js:28:19)
          at noise_removed/node_modules/@jest/core/node_modules/jest-jasmine2/build/queueRunner.js:75:41,
      ]
    `);
    expect(matcherStartHandler.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              "toMatchObject",
              Array [
                Object {
                  "message": "someValue",
                },
              ],
              "rejects",
            ]
        `);
    expect(matcherEndHandler.async.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              Object {
                "success": true,
              },
            ]
        `);
  });

  test('simple resolves modifier failure with wrong value', async () => {
    await expect(async () => {
      const unhook = hookExpect((args) => {
        unhook();
        return expectStartHandler(args);
      });

      await expect(Promise.resolve({ value: 'someValue' })).resolves.toEqual({
        value: 'wrong value',
      });
    }).rejects.toThrowErrorMatchingSnapshot();

    expect(expectStartHandler).toBeCalledTimes(1);
    expect(matcherStartHandler).toBeCalledTimes(1);
    expect(matcherEndHandler.async).toBeCalledTimes(1);
    expect(matcherEndHandler.sync).toBeCalledTimes(0);

    expect(expectStartHandler.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              Array [
                Promise {},
              ],
            ]
        `);
    expect(matcherStartHandler.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              "toEqual",
              Array [
                Object {
                  "value": "wrong value",
                },
              ],
              "resolves",
            ]
        `);
    expect(matcherEndHandler.async.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              Object {
                "error": [Error: expect(received).resolves.toEqual(expected) // deep equality

            - Expected  - 1
            + Received  + 1

              Object {
            -   "value": "wrong value",
            +   "value": "someValue",
              }],
                "success": false,
              },
            ]
        `);
  });

  test('simple resolves modifier failure with rejected promise', async () => {
    await expect(async () => {
      const unhook = hookExpect((args) => {
        unhook();
        return expectStartHandler(args);
      });

      await // eslint-disable-next-line prefer-promise-reject-errors
      expect(Promise.reject({ value: 'someValue' })).resolves.toEqual({
        value: 'someValue',
      });
    }).rejects.toThrowErrorMatchingSnapshot();

    expect(expectStartHandler).toBeCalledTimes(1);
    expect(matcherStartHandler).toBeCalledTimes(1);
    expect(matcherEndHandler.async).toBeCalledTimes(1);
    expect(matcherEndHandler.sync).toBeCalledTimes(0);

    expect(expectStartHandler.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              Array [
                Promise {},
              ],
            ]
        `);
    expect(matcherStartHandler.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              "toEqual",
              Array [
                Object {
                  "value": "someValue",
                },
              ],
              "resolves",
            ]
        `);
    expect(matcherEndHandler.async.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              Object {
                "error": [Error: expect(received).resolves.toEqual()

            Received promise rejected instead of resolved
            Rejected to value: {"value": "someValue"}],
                "success": false,
              },
            ]
        `);
  });

  test('Async matcherEndHandler is being awaited', async () => {
    let counter = 0;

    await expect(
      (async () => {
        const unhook = hookExpect((args) => {
          unhook();

          return function matcherStart() {
            return {
              sync() {
                // noop
              },
              async async() {
                await new Promise((res) => {
                  setTimeout(res, 100);
                });
                counter += 1;
              },
            };
          };
        });

        // eslint-disable-next-line prefer-promise-reject-errors
        await expect(Promise.resolve({ value: 'someValue' })).resolves.toEqual({
          value: 'someValue',
        });
      })()
    ).resolves.toBe(undefined);

    expect(counter).toBe(1);
  });
});
