import type { RootCausePage } from '../interfaces';
import { PuppeteerPageHooker } from '../PuppeteerPageHooker';
import { TestContextMemory } from '../TestContextMemory';
import { createDateMocker } from '../utils';

export async function runPageInstrumentorTest<TPage extends RootCausePage>(
  testName: string,
  fullTestFileName: string,
  page: TPage,
  testCode: (wrappedPage: TPage) => Promise<void>
): Promise<SetupPageInstrumentorForTestingReturn<TPage>['hooks']> {
  const { pageInstrumentor, wrappedPage, hooks } = await setupPageInstrumentorForTesting(
    testName,
    fullTestFileName,
    page
  );

  pageInstrumentor.start();

  await testCode(wrappedPage);

  await pageInstrumentor.end({
    success: true,
  });

  return hooks;
}

interface SetupPageInstrumentorForTestingReturn<TPage extends RootCausePage> {
  wrappedPage: TPage;
  pageInstrumentor: PuppeteerPageHooker;
  hooks: {
    beforeAllHook: jest.Mock<any, any>;
    afterAllHook: jest.Mock;
    beforeEachHook: jest.Mock;
    afterEachHook: jest.Mock;
  };
}

export async function setupPageInstrumentorForTesting<TPage extends RootCausePage>(
  testName: string,
  fullTestFileName: string,
  page: TPage
): Promise<SetupPageInstrumentorForTestingReturn<TPage>> {
  const testContext = new TestContextMemory(
    '/tmp',
    testName,
    `full ${testName}`,
    fullTestFileName,
    {
      screenshots: false,
      console: false,
      networkLogs: false,
      jestAssertions: false,
      html: false,
    },
    createDateMocker()
  );

  const pageInstrumentor = new PuppeteerPageHooker(testContext, page);

  const wrappedPage = pageInstrumentor.wrapWithProxy(page);

  const beforeAllHook = jest.fn();
  const afterAllHook = jest.fn();

  const beforeEachHook = jest.fn();
  const afterEachHook = jest.fn();

  pageInstrumentor.registerBeforeAllHook(beforeAllHook);
  pageInstrumentor.registerAfterAllHook(afterAllHook);
  pageInstrumentor.registerBeforeHook(beforeEachHook);
  pageInstrumentor.registerAfterHook(afterEachHook);

  return {
    wrappedPage,
    pageInstrumentor,
    hooks: {
      beforeAllHook,
      afterAllHook,
      beforeEachHook,
      afterEachHook,
    },
  };
}

const objPropToClean = ['testContext', 'proxyContext', 'rootPage', 'instrumentedFunctionResult'];
export function cleanJestMockFunctionCalls(calls: any[]): any[] {
  return calls.map((callArg) => {
    const cloned = { ...callArg };

    for (const prop of objPropToClean) {
      if (prop in cloned) {
        cloned[prop] = 'cleaned';
      }
    }

    return cloned;
  });
}
