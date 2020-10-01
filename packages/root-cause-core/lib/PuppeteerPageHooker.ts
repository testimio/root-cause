/* eslint-disable no-await-in-loop */
import debug from 'debug';
import { TestEndStatus } from './attachInterfaces';
import type {
  AfterAllHook,
  AfterHook,
  BeforeAllHook,
  BeforeHook,
  IAutomationFrameworkInstrumentor,
  RootCausePage,
} from './interfaces';
import type { TestContext } from './TestContext';

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
  // private handlesRegistry = new WeakMap<any, SubObjectCreationData>();

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
            if (Array.isArray(result)) {
              return result.map((a: any) => pageHookerThis.wrapWithProxy(a));
            }

            return pageHookerThis.wrapWithProxy(result);
          };
        }

        if (returningElementHandlesViaPromise.has(accessedPropAsString)) {
          return async function returningElementHandlesViaPromiseWrappedFunction(...args: any[]) {
            const method = reflectedProperty;
            const result = await method.apply(target, args);

            if (!result) {
              return result;
            }

            if (Array.isArray(result)) {
              return result.map((a: any) => {
                // pageHookerThis.handlesRegistry.set(a, {
                //   creationFunction: accessedPropAsString,
                //   selector: args[0],
                // });
                return pageHookerThis.wrapWithProxy(a);
              });
            }

            // pageHookerThis.handlesRegistry.set(result, {
            //   creationFunction: accessedPropAsString,
            //   selector: args[0],
            // });
            return pageHookerThis.wrapWithProxy(result);
          };
        }

        if (typeof reflectedProperty !== 'function') {
          return reflectedProperty;
        }

        return async function rootCauseWrappedFunction(...args: any[]) {
          testContext.stepStarted();
          for (const beforeHook of beforeHooks) {
            try {
              await beforeHook({
                testContext,
                fnName: accessedPropAsString,
                proxyContext: proxiedObject,
                rootPage,
                args,
              });
            } catch (err) {
              loggerError(err);
            }
          }

          try {
            const method = reflectedProperty;
            const result = await method.apply(target, args);

            for (const afterHook of afterHooks) {
              try {
                await afterHook({
                  testContext,
                  fnName: accessedPropAsString,
                  proxyContext: proxiedObject,
                  rootPage,
                  args,
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
                  testContext,
                  fnName: accessedPropAsString,
                  proxyContext: proxiedObject,
                  rootPage,
                  args,
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
        };
      },
    };

    return new Proxy(proxiedObject, handler) as T;
  }

  async start() {
    for (const beforeAllHook of this.beforeAllHooks) {
      try {
        // await beforeAllHook(this.testContext, this.rootPage, this.rootPage);
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
}
