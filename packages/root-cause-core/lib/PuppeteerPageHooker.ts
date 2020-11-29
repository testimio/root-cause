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
import type { TestContextInterface } from './TestContext';
import { appendToFunctionName, isRootCausePage } from './utils';
import { extractPuppeteerSelector } from './utils/puppeteer-selector-mapping';
import { extractPuppeteerText } from './utils/puppeteer-text-mapping';

// const loggerDebug = debug('root-cause:debug');
const loggerError = debug('root-cause:error');
// swap with this if you need clear log location for dev time and so
// const loggerError = console.error;

const omittedPageMethods = [
  'then',
  'setViewport',
  'screenshot',
  'close',
  'removeListener',
  'constructor',
  'viewport',
];

const returningElementHandlesViaPromise = new Set(['$', '$$', 'waitForSelector', 'evaluateHandle']);
const flatGetters = new Set(['keyboard', 'mouse']);
const gettersViaFunction = new Set(['frames', 'asElement', 'mainFrame']);

type EventsHandlersRegistry = WeakMap<
  {},
  Map<string, WeakMap<(...args: unknown[]) => unknown, (...args: unknown[]) => unknown>>
>;

export class PuppeteerPageHooker implements IAutomationFrameworkInstrumentor {
  public paused = false;
  private wrappedEventsHandlersRegistry: EventsHandlersRegistry = new WeakMap();
  private pageIdsCounter = 0;

  constructor(private testContext: TestContextInterface, private rootPage: RootCausePage) {}

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
    return this.innerWrapWithProxy(proxiedObject, [], 0);
  }

  private innerWrapWithProxy<T extends object>(
    proxiedObject: T,
    methodCallData: ProxiedMethodCallData[],
    pageId: number
  ): T {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const pauseStateHolder: { paused: boolean } = this;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const pageHookerThis = this;
    const handler: ProxyHandler<T> = {
      get(target, prop, receiver) {
        // wrap event handlers only on pages objects only
        if (isRootCausePage(target)) {
          if (prop === 'on' || prop === 'addListener') {
            return pageHookerThis.onMethodMiddleman.bind(pageHookerThis, target);
          }

          if (prop === 'off' || prop === 'removeListener') {
            return pageHookerThis.offMethodMiddleman.bind(pageHookerThis, target);
          }

          if (prop === 'once') {
            return pageHookerThis.onceMethodMiddleman.bind(pageHookerThis, target);
          }

          // playwright only
          if (prop === 'waitForEvent') {
            if (!('waitForEvent' in target)) {
              return undefined;
            }

            return pageHookerThis.waitForEventMiddleman.bind(pageHookerThis, target);
          }
        }

        // end wrap event handlers

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
              pageId,
            };

            return pageHookerThis.wrapReturnValueInProxy(
              result,
              methodCallData,
              newMethodCallData,
              pageId
            );
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
                methodCallData,
                pageId
              );

              if (!result) {
                return result;
              }

              const newMethodCallData: ProxiedMethodCallData = {
                selector: extractPuppeteerSelector(proxiedObject, accessedPropAsString, args),
                creationFunction: accessedPropAsString,
                text: extractPuppeteerText(proxiedObject, accessedPropAsString, args, result),
                pageId,
              };

              return pageHookerThis.wrapReturnValueInProxy(
                result,
                methodCallData,
                newMethodCallData,
                pageId
              );
            },
            `_${proxiedObject.constructor.name}_${accessedPropAsString}`
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
            methodCallData,
            pageId
          );
        }, `_${proxiedObject.constructor.name}_${accessedPropAsString}`);
      },
    };

    return new Proxy(proxiedObject, handler) as T;
  }

  async start(): Promise<void> {
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

  async end(endStatus: TestEndStatus<unknown, unknown>): Promise<void> {
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
    methodCallData: ProxiedMethodCallData,
    pageId: number
  ) {
    if (Array.isArray(result)) {
      return result.map((element: any, index: number) => {
        return this.innerWrapWithProxy(
          element,
          previousMethodCallData.concat({ ...methodCallData, index }),
          pageId
        );
      });
    }

    return this.innerWrapWithProxy(result, previousMethodCallData.concat(methodCallData), pageId);
  }

  private async makeStep(
    proxyContext: any,
    target: any,
    method: any,
    fnName: string,
    args: any[],
    methodCallData: ProxiedMethodCallData[],
    pageId: number
  ) {
    const { beforeHooks, afterHooks, testContext, rootPage } = this;

    const runningStep = testContext.stepStarted();
    runningStep.pageId = pageId;

    const newMethodCallData: ProxiedMethodCallData = {
      selector: extractPuppeteerSelector(proxyContext, fnName, args),
      creationFunction: fnName,
      pageId,
    };

    methodCallData = methodCallData.concat(newMethodCallData);

    const commonHookArgs: CommonEachHookArgs = {
      testContext,
      fnName,
      proxyContext,
      rootPage,
      args,
      methodCallData,
      stepResult: runningStep,
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
      await testContext.stepEnded(runningStep);
    }
  }

  /**
   * playwright only
   */
  private waitForEventMiddleman = async (
    target: RootCausePage,
    eventName: string,
    optionsOrPredicate?: unknown
  ) => {
    if (eventName === 'popup') {
      // @ts-expect-error we can't ensure types here
      const newPage = await target.waitForEvent(eventName, optionsOrPredicate);
      return this.innerWrapWithProxy(newPage, [], ++this.pageIdsCounter);
    }

    // @ts-expect-error we can't ensure types here
    return target.waitForEvent(eventName, optionsOrPredicate);
  };

  private onMethodMiddleman = (
    target: RootCausePage,
    eventName: string,
    userEventHandler: (...args: unknown[]) => unknown
  ) => {
    // Wrap only 'popup' event, ignore others
    if (eventName !== 'popup') {
      // @ts-expect-error can't ensure types
      return target.on(eventName, userEventHandler);
    }

    const ourPopupHandler = (newPage: RootCausePage) => {
      const wrappedPage = this.innerWrapWithProxy(newPage, [], ++this.pageIdsCounter);
      userEventHandler(wrappedPage);
    };

    this.addAssociatedEventHandler(target, 'popup', userEventHandler, ourPopupHandler);

    // @ts-expect-error can't ensure types
    return target.on('popup', ourPopupHandler);
  };

  private offMethodMiddleman = (
    target: RootCausePage,
    eventName: string,
    userEventHandler: (...args: []) => unknown
  ) => {
    const actualOurHandler = this.getAssociatedEventHandler(target, eventName, userEventHandler);

    if (actualOurHandler) {
      // @ts-expect-error can't ensure types
      return target.off(eventName, actualOurHandler);
    }

    // @ts-expect-error can't ensure types
    return target.off(eventName, userEventHandler);
  };

  private onceMethodMiddleman = (
    target: RootCausePage,
    eventName: string,
    userEventHandler: (...args: unknown[]) => unknown
  ) => {
    // Wrap only 'popup' event, ignore others
    if (eventName !== 'popup') {
      // @ts-expect-error can't ensure types
      return target.once(eventName, handler);
    }

    const ourOncePopupHandler = (newPage: RootCausePage) => {
      const wrappedPage = this.innerWrapWithProxy(newPage, [], ++this.pageIdsCounter);
      userEventHandler(wrappedPage);
    };

    this.addAssociatedEventHandler(target, 'popup', userEventHandler, ourOncePopupHandler);

    // @ts-expect-error can't ensure types
    return target.once(eventName, ourOncePopupHandler);
  };

  private getAssociatedEventHandler(
    target: RootCausePage,
    eventName: string,
    userHandler: (...args: unknown[]) => unknown
  ): undefined | ((...args: unknown[]) => unknown) {
    return this.wrappedEventsHandlersRegistry.get(target)?.get(eventName)?.get(userHandler);
  }

  private addAssociatedEventHandler(
    target: RootCausePage,
    eventName: string,
    userHandler: (...args: unknown[]) => unknown,
    ourHandler: (...args: any[]) => unknown
  ): void {
    let mapForTarget = this.wrappedEventsHandlersRegistry.get(target);

    if (!mapForTarget) {
      mapForTarget = new Map<
        string,
        WeakMap<(...args: unknown[]) => unknown, (...args: unknown[]) => unknown>
      >();
      this.wrappedEventsHandlersRegistry.set(target, mapForTarget);
    }

    let mapOfEvent = mapForTarget.get(eventName);

    if (!mapOfEvent) {
      mapOfEvent = new WeakMap<(...args: unknown[]) => unknown, (...args: unknown[]) => unknown>();
      mapForTarget.set(eventName, mapOfEvent);
    }

    mapOfEvent.set(userHandler, ourHandler);
  }
}
