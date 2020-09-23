/* eslint-disable no-await-in-loop */
import type {
  IAutomationFrameworkInstrumentor,
  BeforeAllHook,
  AfterAllHook,
  BeforeHook,
  AfterHook,
  RootCausePage,
} from './interfaces';
import type { TestContext } from './TestContext';
import { TestEndStatus } from './attachInterfaces';

import debug from 'debug';

// const loggerDebug = debug('root-cause:debug');
const loggerError = debug('root-cause:error');
// swap with this if you need clear log location for dev time and so
// const loggerError = console.error;

const ommittedPageMethods = [
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

const proxiedTypes = ['frames', 'keyboard', 'mouse', '$', '$$', 'waitForSelector'];

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
    const { beforeHooks, afterHooks, testContext, rootPage } = this;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const pauseStateHolder: { paused: boolean } = this;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const pageHookerThis = this;
    const handler: ProxyHandler<T> = {
      get(target, prop, receiver) {
        const reflectedProperty = Reflect.get(target, prop, receiver);

        // Possible alternative: implement pausing by not calling hooks and not short circuit wrapping
        if (
          prop.toString().startsWith('_') ||
          ommittedPageMethods.includes(prop.toString()) ||
          pauseStateHolder.paused
        ) {
          return reflectedProperty;
        }

        if (proxiedTypes.includes(prop.toString())) {
          if (typeof reflectedProperty === 'function') {
            return (...args: any[]) => {
              const method = reflectedProperty;
              const result = method.apply(target, args);

              if (!result) {
                return result;
              }

              if (result.constructor && result.constructor.name === 'Promise') {
                return result.then((resultOfPromiseReturnedByTopLevelFunction: any | any[]) => {
                  if (!resultOfPromiseReturnedByTopLevelFunction) {
                    return resultOfPromiseReturnedByTopLevelFunction;
                  }

                  if (resultOfPromiseReturnedByTopLevelFunction.length) {
                    const proxiedResult = resultOfPromiseReturnedByTopLevelFunction.map((a: any) =>
                      pageHookerThis.wrapWithProxy(a)
                    );
                    return proxiedResult;
                  }
                  return pageHookerThis.wrapWithProxy(resultOfPromiseReturnedByTopLevelFunction);
                });
              }
              if (result.length) {
                const proxiedResult = result.map((a: any) => pageHookerThis.wrapWithProxy(a));
                return proxiedResult;
              }
              return pageHookerThis.wrapWithProxy(result);
            };
          }
          return pageHookerThis.wrapWithProxy(reflectedProperty);
        }

        if (typeof reflectedProperty !== 'function') {
          return reflectedProperty;
        }

        return async function rootCauseWrappedFunction(...args: any[]) {
          testContext.stepStarted();
          for (const beforeHook of beforeHooks) {
            try {
              await beforeHook(testContext, prop.toString(), proxiedObject, rootPage, args);
            } catch (err) {
              loggerError(err);
            }
          }

          try {
            const method = reflectedProperty;
            const result = await method.apply(target, args);

            for (const afterHook of afterHooks) {
              try {
                await afterHook(testContext, prop.toString(), proxiedObject, rootPage, args, {
                  success: true,
                  data: result,
                });
              } catch (err) {
                loggerError(err);
              }
            }

            return result;
          } catch (err) {
            for (const afterHook of afterHooks) {
              try {
                await afterHook(testContext, prop.toString(), proxiedObject, rootPage, args, {
                  success: false,
                  error: err,
                });
              } catch (err) {
                loggerError(err);
              }
            }

            throw err;
          } finally {
            await testContext.stepEnded();
          }
        };
      },
    };

    return new Proxy(proxiedObject, handler) as T;
  }

  async start() {
    for (const beforeAllHook of this.beforeAllHooks) {
      try {
        await beforeAllHook(this.testContext, this.rootPage, this.rootPage);
      } catch (e) {
        loggerError(e);
      }
    }
  }

  async end(endStatus: TestEndStatus<unknown, unknown>) {
    for (const afterAllHook of this.afterAllHooks) {
      try {
        await afterAllHook(this.testContext, endStatus);
      } catch (e) {
        loggerError(e);
      }
    }
    await this.testContext.testEnded();
  }
}
