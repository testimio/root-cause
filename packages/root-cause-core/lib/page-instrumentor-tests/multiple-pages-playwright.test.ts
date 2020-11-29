import {
  getCleanAllPathsPrettyFormatPlugin,
  getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin,
} from '@testim/internal-self-tests-helpers';
import playwright from 'playwright';
import { cleanJestMockFunctionCalls, runPageInstrumentorTest } from './utils';
import { sleep } from '../utils';

describe('Multiple pages', () => {
  jest.setTimeout(30_000);
  expect.addSnapshotSerializer(getCleanAllPathsPrettyFormatPlugin(process.cwd()));
  expect.addSnapshotSerializer(getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin());

  describe('Playwright chromium', () => {
    let browser: playwright.Browser;
    let browserContext: playwright.BrowserContext;
    let page: playwright.Page;

    beforeAll(async () => {
      // https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox
      // Not optimal, but didn't work on circle on circleci/node:12.17-stretch-browsers without it
      // Need to revisit
      browser = await playwright.chromium.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    });

    afterAll(async () => {
      await browser.close();
    });

    beforeEach(async () => {
      browserContext = await browser.newContext();
      page = await browserContext.newPage();
    });

    afterEach(async () => {
      await page.close();
      await browserContext.close();
    });

    test('page.once, ensure page.off is working', async () => {
      await runPageInstrumentorTest('page.once method', __filename, page, async (wrappedPage) => {
        await wrappedPage.setContent('<a href="about:blank" target="blank">CLICK HERE</a>');

        const onceHandler = jest.fn();
        wrappedPage.once('popup', onceHandler);
        wrappedPage.off('popup', onceHandler);

        await wrappedPage.click('a');

        // wait some arbitrary time
        await sleep(100);
        expect(onceHandler).not.toBeCalled();
      });
    });

    test('page.once, ensure page.removeListener is working', async () => {
      await runPageInstrumentorTest('page.once method', __filename, page, async (wrappedPage) => {
        await wrappedPage.setContent('<a href="about:blank" target="blank">CLICK HERE</a>');

        const onceHandler = jest.fn();
        wrappedPage.once('popup', onceHandler);
        wrappedPage.removeListener('popup', onceHandler);

        await wrappedPage.click('a');

        // wait some arbitrary time
        await sleep(100);
        expect(onceHandler).not.toBeCalled();
      });
    });

    test('page.addListener, ensure page.removeListener is working', async () => {
      await runPageInstrumentorTest('page.once method', __filename, page, async (wrappedPage) => {
        await wrappedPage.setContent('<a href="about:blank" target="blank">CLICK HERE</a>');

        const onceHandler = jest.fn();
        wrappedPage.addListener('popup', onceHandler);
        wrappedPage.removeListener('popup', onceHandler);

        await wrappedPage.click('a');

        // wait some arbitrary time
        await sleep(100);
        expect(onceHandler).not.toBeCalled();
      });
    });

    test('page.on, ensure page.off is working', async () => {
      await runPageInstrumentorTest('page.once method', __filename, page, async (wrappedPage) => {
        await wrappedPage.setContent('<a href="about:blank" target="blank">CLICK HERE</a>');

        const onceHandler = jest.fn();
        wrappedPage.on('popup', onceHandler);
        wrappedPage.off('popup', onceHandler);

        await wrappedPage.click('a');

        // wait some arbitrary time
        await sleep(100);
        expect(onceHandler).not.toBeCalled();
      });
    });

    test('page.addListener("popup") method', async () => {
      const {
        beforeAllHook,
        afterAllHook,
        beforeEachHook,
        afterEachHook,
      } = await runPageInstrumentorTest(
        'page.addListener("popup") method',
        __filename,
        page,
        async (wrappedPage) => {
          await wrappedPage.setContent('<a href="about:blank" target="blank">CLICK HERE</a>');

          const [, newPage] = await Promise.all([
            wrappedPage.click('a'),
            new Promise<playwright.Page>((res) => {
              wrappedPage.addListener('popup', res);
            }),
          ]);
          await newPage.click('body');
        }
      );

      expect(beforeAllHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchSnapshot(
        'beforeAllHook'
      );
      expect(afterAllHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchSnapshot(
        'afterAllHook'
      );

      expect(beforeEachHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchSnapshot(
        'beforeEachHook'
      );

      expect(afterEachHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchSnapshot(
        'afterEachHook'
      );
    });

    test('page.on("popup") method', async () => {
      const {
        beforeAllHook,
        afterAllHook,
        beforeEachHook,
        afterEachHook,
      } = await runPageInstrumentorTest(
        'page.on("popup") method',
        __filename,
        page,
        async (wrappedPage) => {
          await wrappedPage.setContent('<a href="about:blank" target="blank">CLICK HERE</a>');

          const [, newPage] = await Promise.all([
            wrappedPage.click('a'),
            new Promise<playwright.Page>((res) => {
              wrappedPage.on('popup', res);
            }),
          ]);
          await newPage.click('body');
        }
      );

      expect(beforeAllHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchSnapshot(
        'beforeAllHook'
      );
      expect(afterAllHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchSnapshot(
        'afterAllHook'
      );

      expect(beforeEachHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchSnapshot(
        'beforeEachHook'
      );

      expect(afterEachHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchSnapshot(
        'afterEachHook'
      );
    });

    test('page.once method', async () => {
      const {
        beforeAllHook,
        afterAllHook,
        beforeEachHook,
        afterEachHook,
      } = await runPageInstrumentorTest(
        'page.once method',
        __filename,
        page,
        async (wrappedPage) => {
          await wrappedPage.setContent('<a href="about:blank" target="blank">CLICK HERE</a>');

          const [, newPage] = await Promise.all([
            wrappedPage.click('a'),
            new Promise<playwright.Page>((res) => {
              wrappedPage.once('popup', res);
            }),
          ]);
          await newPage.click('body');
        }
      );

      expect(beforeAllHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "testContext": "cleaned",
            },
          ],
        ]
      `);
      expect(afterAllHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "endStatus": Object {
                "success": true,
              },
              "testContext": "cleaned",
            },
          ],
        ]
      `);

      expect(beforeEachHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "args": Array [
                "<a href=\\"about:blank\\" target=\\"blank\\">CLICK HERE</a>",
              ],
              "fnName": "setContent",
              "methodCallData": Array [
                Object {
                  "creationFunction": "setContent",
                  "pageId": 0,
                  "selector": undefined,
                  "text": undefined,
                },
              ],
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "stepResult": "cleaned",
              "testContext": "cleaned",
            },
          ],
          Array [
            Object {
              "args": Array [
                "a",
              ],
              "fnName": "click",
              "methodCallData": Array [
                Object {
                  "creationFunction": "click",
                  "pageId": 0,
                  "selector": "a",
                  "text": undefined,
                },
              ],
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "stepResult": "cleaned",
              "testContext": "cleaned",
            },
          ],
          Array [
            Object {
              "args": Array [
                "body",
              ],
              "fnName": "click",
              "methodCallData": Array [
                Object {
                  "creationFunction": "click",
                  "pageId": 1,
                  "selector": "body",
                  "text": undefined,
                },
              ],
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "stepResult": "cleaned",
              "testContext": "cleaned",
            },
          ],
        ]
      `);

      expect(afterEachHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "args": Array [
                "<a href=\\"about:blank\\" target=\\"blank\\">CLICK HERE</a>",
              ],
              "fnName": "setContent",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "setContent",
                  "pageId": 0,
                  "selector": undefined,
                  "text": undefined,
                },
              ],
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "stepResult": "cleaned",
              "testContext": "cleaned",
            },
          ],
          Array [
            Object {
              "args": Array [
                "a",
              ],
              "fnName": "click",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "click",
                  "pageId": 0,
                  "selector": "a",
                  "text": undefined,
                },
              ],
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "stepResult": "cleaned",
              "testContext": "cleaned",
            },
          ],
          Array [
            Object {
              "args": Array [
                "body",
              ],
              "fnName": "click",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "click",
                  "pageId": 1,
                  "selector": "body",
                  "text": undefined,
                },
              ],
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "stepResult": "cleaned",
              "testContext": "cleaned",
            },
          ],
        ]
      `);
    });

    test('multiple pages playwright - waitForEvent', async () => {
      const {
        beforeAllHook,
        afterAllHook,
        beforeEachHook,
        afterEachHook,
      } = await runPageInstrumentorTest(
        'multiple pages playwright - waitForEvent',
        __filename,
        page,
        async (wrappedPage) => {
          await wrappedPage.setContent('<a href="about:blank" target="blank">CLICK HERE</a>');
          const [, newPage] = await Promise.all([
            wrappedPage.click('a'),
            wrappedPage.waitForEvent('popup'),
          ]);
          await newPage.click('body');
        }
      );

      expect(beforeAllHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "testContext": "cleaned",
            },
          ],
        ]
      `);
      expect(afterAllHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "endStatus": Object {
                "success": true,
              },
              "testContext": "cleaned",
            },
          ],
        ]
      `);

      expect(beforeEachHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "args": Array [
                "<a href=\\"about:blank\\" target=\\"blank\\">CLICK HERE</a>",
              ],
              "fnName": "setContent",
              "methodCallData": Array [
                Object {
                  "creationFunction": "setContent",
                  "pageId": 0,
                  "selector": undefined,
                  "text": undefined,
                },
              ],
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "stepResult": "cleaned",
              "testContext": "cleaned",
            },
          ],
          Array [
            Object {
              "args": Array [
                "a",
              ],
              "fnName": "click",
              "methodCallData": Array [
                Object {
                  "creationFunction": "click",
                  "pageId": 0,
                  "selector": "a",
                  "text": undefined,
                },
              ],
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "stepResult": "cleaned",
              "testContext": "cleaned",
            },
          ],
          Array [
            Object {
              "args": Array [
                "body",
              ],
              "fnName": "click",
              "methodCallData": Array [
                Object {
                  "creationFunction": "click",
                  "pageId": 1,
                  "selector": "body",
                  "text": undefined,
                },
              ],
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "stepResult": "cleaned",
              "testContext": "cleaned",
            },
          ],
        ]
      `);

      expect(afterEachHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "args": Array [
                "<a href=\\"about:blank\\" target=\\"blank\\">CLICK HERE</a>",
              ],
              "fnName": "setContent",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "setContent",
                  "pageId": 0,
                  "selector": undefined,
                  "text": undefined,
                },
              ],
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "stepResult": "cleaned",
              "testContext": "cleaned",
            },
          ],
          Array [
            Object {
              "args": Array [
                "a",
              ],
              "fnName": "click",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "click",
                  "pageId": 0,
                  "selector": "a",
                  "text": undefined,
                },
              ],
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "stepResult": "cleaned",
              "testContext": "cleaned",
            },
          ],
          Array [
            Object {
              "args": Array [
                "body",
              ],
              "fnName": "click",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "click",
                  "pageId": 1,
                  "selector": "body",
                  "text": undefined,
                },
              ],
              "proxyContext": "cleaned",
              "rootPage": "cleaned",
              "stepResult": "cleaned",
              "testContext": "cleaned",
            },
          ],
        ]
      `);
    });
  });
});
