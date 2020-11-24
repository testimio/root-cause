import {
  getCleanAllPathsPrettyFormatPlugin,
  getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin,
} from '@testim/internal-self-tests-helpers';
import playwright from 'playwright';
import puppeteer from 'puppeteer';
import { cleanJestMockFunctionCalls, runPageInstrumentorTest } from './utils';

describe('assorted page instrumentations', () => {
  jest.setTimeout(30_000);
  expect.addSnapshotSerializer(getCleanAllPathsPrettyFormatPlugin(process.cwd()));
  expect.addSnapshotSerializer(getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin());

  describe('Puppeteer chromium', () => {
    let browser: puppeteer.Browser;
    let browserContext: puppeteer.BrowserContext;
    let page: puppeteer.Page;

    beforeAll(async () => {
      // https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox
      // Not optimal, but didn't work on circle on circleci/node:12.17-stretch-browsers without it
      // Need to revisit
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    });

    afterAll(async () => {
      await browser.close();
    });

    beforeEach(async () => {
      browserContext = await browser.createIncognitoBrowserContext();
      page = await browserContext.newPage();
    });

    afterEach(async () => {
      await page.close();
      await browserContext.close();
    });

    test('evaluateHandle with document and mainFrame', async () => {
      const {
        beforeAllHook,
        afterAllHook,
        beforeEachHook,
        afterEachHook,
      } = await runPageInstrumentorTest(
        'assorted page instrumentations 1',
        __filename,
        page,
        async (wrappedPage) => {
          await wrappedPage.mainFrame().focus('body');
          const elementHandle = await wrappedPage.evaluateHandle('document.body');

          await elementHandle.asElement()?.click();
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
                "body",
              ],
              "fnName": "focus",
              "methodCallData": Array [
                Object {
                  "creationFunction": "mainFrame",
                  "selector": undefined,
                  "text": undefined,
                },
                Object {
                  "creationFunction": "focus",
                  "selector": "body",
                  "text": "body",
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
                "document.body",
              ],
              "fnName": "evaluateHandle",
              "methodCallData": Array [
                Object {
                  "creationFunction": "evaluateHandle",
                  "selector": "document.body",
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
              "args": Array [],
              "fnName": "click",
              "methodCallData": Array [
                Object {
                  "creationFunction": "evaluateHandle",
                  "selector": "document.body",
                  "text": undefined,
                },
                Object {
                  "creationFunction": "asElement",
                  "selector": undefined,
                  "text": undefined,
                },
                Object {
                  "creationFunction": "click",
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
        ]
      `);

      expect(afterEachHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "args": Array [
                "body",
              ],
              "fnName": "focus",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "mainFrame",
                  "selector": undefined,
                  "text": undefined,
                },
                Object {
                  "creationFunction": "focus",
                  "selector": "body",
                  "text": "body",
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
                "document.body",
              ],
              "fnName": "evaluateHandle",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "evaluateHandle",
                  "selector": "document.body",
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
              "args": Array [],
              "fnName": "click",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "evaluateHandle",
                  "selector": "document.body",
                  "text": undefined,
                },
                Object {
                  "creationFunction": "asElement",
                  "selector": undefined,
                  "text": undefined,
                },
                Object {
                  "creationFunction": "click",
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
        ]
      `);
    });

    test('Parallel steps', async () => {
      const {
        beforeAllHook,
        afterAllHook,
        beforeEachHook,
        afterEachHook,
      } = await runPageInstrumentorTest(
        'assorted page instrumentations 1',
        __filename,
        page,
        async (wrappedPage) => {
          // these are parallel steps
          // the second step will be finished before the first one
          await Promise.all([
            wrappedPage.evaluate(`() => {
              return new Promise((resolve) => {
                setTimeout(resolve, 500);
              });
            }`),
            wrappedPage.click('body'),
          ]);
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
                "() => {
                      return new Promise((resolve) => {
                        setTimeout(resolve, 500);
                      });
                    }",
              ],
              "fnName": "evaluate",
              "methodCallData": Array [
                Object {
                  "creationFunction": "evaluate",
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
                "body",
              ],
              "fnName": "click",
              "methodCallData": Array [
                Object {
                  "creationFunction": "click",
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
                "() => {
                      return new Promise((resolve) => {
                        setTimeout(resolve, 500);
                      });
                    }",
              ],
              "fnName": "evaluate",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "evaluate",
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
                "body",
              ],
              "fnName": "click",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "click",
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

    test('evaluateHandle with document and mainFrame', async () => {
      const {
        beforeAllHook,
        afterAllHook,
        beforeEachHook,
        afterEachHook,
      } = await runPageInstrumentorTest(
        'assorted page instrumentations 1',
        __filename,
        page,
        async (wrappedPage) => {
          await wrappedPage.mainFrame().focus('body');
          const elementHandle = await wrappedPage.evaluateHandle('document.body');

          await elementHandle.asElement()?.click();
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
                "body",
              ],
              "fnName": "focus",
              "methodCallData": Array [
                Object {
                  "creationFunction": "mainFrame",
                  "selector": undefined,
                  "text": undefined,
                },
                Object {
                  "creationFunction": "focus",
                  "selector": "body",
                  "text": "body",
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
                "document.body",
              ],
              "fnName": "evaluateHandle",
              "methodCallData": Array [
                Object {
                  "creationFunction": "evaluateHandle",
                  "selector": "document.body",
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
              "args": Array [],
              "fnName": "click",
              "methodCallData": Array [
                Object {
                  "creationFunction": "evaluateHandle",
                  "selector": "document.body",
                  "text": undefined,
                },
                Object {
                  "creationFunction": "asElement",
                  "selector": undefined,
                  "text": undefined,
                },
                Object {
                  "creationFunction": "click",
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
        ]
      `);

      expect(afterEachHook.mock.calls.map(cleanJestMockFunctionCalls)).toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "args": Array [
                "body",
              ],
              "fnName": "focus",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "mainFrame",
                  "selector": undefined,
                  "text": undefined,
                },
                Object {
                  "creationFunction": "focus",
                  "selector": "body",
                  "text": "body",
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
                "document.body",
              ],
              "fnName": "evaluateHandle",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "evaluateHandle",
                  "selector": "document.body",
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
              "args": Array [],
              "fnName": "click",
              "instrumentedFunctionResult": "cleaned",
              "methodCallData": Array [
                Object {
                  "creationFunction": "evaluateHandle",
                  "selector": "document.body",
                  "text": undefined,
                },
                Object {
                  "creationFunction": "asElement",
                  "selector": undefined,
                  "text": undefined,
                },
                Object {
                  "creationFunction": "click",
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
        ]
      `);
    });
  });
});
