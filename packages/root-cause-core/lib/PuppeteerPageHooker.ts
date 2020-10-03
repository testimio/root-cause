/* eslint-disable no-await-in-loop */
import debug from 'debug';
import { TestEndStatus } from './attachInterfaces';
import type {
  AfterAllHook,
  AfterHook,
  BeforeAllHook,
  BeforeHook,
  CommonEachHookArgs,
  IAutomationFrameworkInstrumentor,
  ProxiedMethodCallData,
  RootCausePage,
} from './interfaces';
import type { TestContext } from './TestContext';
import { appendToFunctionName } from './utils';
import { extractPuppeteerSelector } from './utils/puppeteer-selector-mapping';
import { extractPuppeteerText } from './utils/puppeteer-text-mapping';

// const loggerDebug = debug('root-cause:debug');
const loggerError = debug('root-cause:error');
// swap with this if you need clear log location for dev time and so
// const loggerError = console.error;

const omittedPageMethods = [
  'then',
  'setViewport',
  'mainFrame',
  'screenshot',
  'close',
  'removeListener',
  'off',
  'constructor',
  'viewport',
];

const returningElementHandlesViaPromise = new Set(['$', '$$', 'waitForSelector']);
const flatGetters = new Set(['keyboard', 'mouse']);
const gettersViaFunction = new Set(['frames']);

export class PuppeteerPageHooker implements IAutomationFrameworkInstrumentor {
  public paused = false;

  constructor(private testContext: TestContext, private rootPage: RootCausePage) {}

  pause(): void {
    this.paused = true;
  }
  resume(): void {
    this.paused = false;
  }

  registerBeforeAllHook(hook: BeforeAllHook): void {
    this.beforeAllHooks.push(hook);
  }

  registerAfterAllHook(hook: AfterAllHook): void {
    this.afterAllHooks.push(hook);
  }

  registerBeforeHook(hook: BeforeHook): void {
    this.beforeHooks.push(hook);
  }

  registerAfterHook(hook: AfterHook): void {
    this.afterHooks.push(hook);
  }

  private beforeAllHooks: Array<BeforeAllHook> = [];
  private afterAllHooks: Array<AfterAllHook> = [];
  private beforeHooks: Array<BeforeHook> = [];
  private afterHooks: Array<AfterHook> = [];

  wrapWithProxy<T extends object>(proxiedObject: T): T {
    return this.innerWrapWithProxy(proxiedObject, []);
  }

  private innerWrapWithProxy<T extends object>(
    proxiedObject: T,
    methodCallData: ProxiedMethodCallData[]
  ): T {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const pauseStateHolder: { paused: boolean } = this;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const pageHookerThis = this;
    const handler: ProxyHandler<T> = {
      get(target, prop, receiver) {
        const reflectedProperty = Reflect.get(target, prop, receiver);
        const accessedPropAsString = prop.toString();

        // Possible alternative: implement pausing by not calling hooks and not short circuit wrapping
        if (
          accessedPropAsString.startsWith('_') ||
          omittedPageMethods.includes(accessedPropAsString) ||
          pauseStateHolder.paused
        ) {
          return reflectedProperty;
        }

        if (flatGetters.has(accessedPropAsString)) {
          return pageHookerThis.wrapWithProxy(reflectedProperty);
        }

        if (gettersViaFunction.has(accessedPropAsString)) {
          const method = reflectedProperty;
          return function gettersViaFunctionWrapped(...args: any[]) {
            const result = method.apply(target, args);

            const newMethodCallData: ProxiedMethodCallData = {
              selector: extractPuppeteerSelector(proxiedObject, accessedPropAsString, args),
              creationFunction: accessedPropAsString,
              text: extractPuppeteerText(proxiedObject, accessedPropAsString, args, result),
            };

            return pageHookerThis.wrapReturnValueInProxy(result, methodCallData, newMethodCallData);
          };
        }

        if (returningElementHandlesViaPromise.has(accessedPropAsString)) {
          return appendToFunctionName(
            async function returningElementHandlesViaPromiseWrappedFunction(...args: any[]) {
              const result = await pageHookerThis.makeStep(
                proxiedObject,
                target,
                reflectedProperty,
                accessedPropAsString,
                args,
                methodCallData
              );

              if (!result) {
                return result;
              }

              const newMethodCallData: ProxiedMethodCallData = {
                selector: extractPuppeteerSelector(proxiedObject, accessedPropAsString, args),
                creationFunction: accessedPropAsString,
                text: extractPuppeteerText(proxiedObject, accessedPropAsString, args, result),
              };

              return pageHookerThis.wrapReturnValueInProxy(
                result,
                methodCallData,
                newMethodCallData
              );
            },
            `_${accessedPropAsString}`
          );
        }

        if (typeof reflectedProperty !== 'function') {
          return reflectedProperty;
        }

        return appendToFunctionName(async function rootCauseWrappedFunction(...args: any[]) {
          return await pageHookerThis.makeStep(
            proxiedObject,
            target,
            reflectedProperty,
            accessedPropAsString,
            args,
            methodCallData
          );
        }, `_${accessedPropAsString}`);
      },
    };

    return new Proxy(proxiedObject, handler) as T;
  }

  async start() {
    for (const beforeAllHook of this.beforeAllHooks) {
      try {
        await beforeAllHook({
          testContext: this.testContext,
          rootPage: this.rootPage,
          proxyContext: this.rootPage,
        });
      } catch (e) {
        loggerError(e);
      }
    }
  }

  async end(endStatus: TestEndStatus<unknown, unknown>) {
    for (const afterAllHook of this.afterAllHooks) {
      try {
        await afterAllHook({ testContext: this.testContext, endStatus });
      } catch (e) {
        loggerError(e);
      }
    }
    await this.testContext.testEnded();
  }

  private wrapReturnValueInProxy(
    result: any,
    previousMethodCallData: ProxiedMethodCallData[],
    methodCallData: ProxiedMethodCallData
  ) {
    if (Array.isArray(result)) {
      return result.map((element: any, index: number) => {
        return this.innerWrapWithProxy(
          element,
          previousMethodCallData.concat({ ...methodCallData, index })
        );
      });
    }

    return this.innerWrapWithProxy(result, previousMethodCallData.concat(methodCallData));
  }

  private async makeStep(
    proxyContext: any,
    target: any,
    method: any,
    fnName: string,
    args: any[],
    methodCallData: ProxiedMethodCallData[]
  ) {
    const { beforeHooks, afterHooks, testContext, rootPage } = this;

    testContext.stepStarted();

    const newMethodCallData: ProxiedMethodCallData = {
      selector: extractPuppeteerSelector(proxyContext, fnName, args),
      creationFunction: fnName,
    };

    methodCallData = methodCallData.concat(newMethodCallData);

    const commonHookArgs: CommonEachHookArgs = {
      testContext,
      fnName,
      proxyContext,
      rootPage,
      args,
      methodCallData,
    };

    for (const beforeHook of beforeHooks) {
      try {
        await beforeHook({ ...commonHookArgs });
      } catch (err) {
        loggerError(err);
      }
    }

    try {
      const result = await method.apply(target, args);

      newMethodCallData.text = extractPuppeteerText(proxyContext, fnName, args, result);

      for (const afterHook of afterHooks) {
        try {
          await afterHook({
            ...commonHookArgs,
            instrumentedFunctionResult: {
              success: true,
              data: result,
            },
          });
        } catch (err) {
          loggerError(err);
        }
      }

      return result;
    } catch (err) {
      for (const afterHook of afterHooks) {
        try {
          await afterHook({
            ...commonHookArgs,
            instrumentedFunctionResult: {
              success: false,
              error: err,
            },
          });
        } catch (err) {
          loggerError(err);
        }
      }

      throw err;
    } finally {
      await testContext.stepEnded();
    }
  }
}
