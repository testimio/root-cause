// eslint-disable-next-line import/no-extraneous-dependencies
import type { expect } from '@jest/globals';

type ExpectType = typeof expect;
type ExpectReturnType = ReturnType<ExpectType>;

/**
 * eg
 * expect('1').toBe('2');
 * expect('1').not.toBe('2');
 * expect('1').rejects.toBe('2');
 * expect('1').resolves.toBe('2');
 */
const matchersModifiers = ['not', 'rejects', 'resolves'] as const;

function isMatcherModifier(key: unknown): key is typeof matchersModifiers[number] {
  return matchersModifiers.includes(key as any);
}

export type MatcherEndResultAsync = { success: true } | { success: false; error: unknown };
export type MatcherEndResultSync = { success: true } | { success: false; error: unknown };

export type ExpectStartHandler = (expectArgs: any[], stacktrace: string) => MatcherStartHandler;
export type MatcherStartHandler = (
  matcherName: string,
  matcherArgs: any[],
  modifier: typeof matchersModifiers[number] | 'root'
) => MatcherEndHandler;

export type MatcherEndHandler = {
  sync(result: MatcherEndResultSync): void;
  async(result: MatcherEndResultAsync): Promise<void>;
};

export function hookExpect(expectStartHandler: ExpectStartHandler) {
  if (!('expect' in global)) {
    throw new Error('expect is not available globally, are we inside a jest test?');
  }

  // @ts-ignore
  const originalExpect = global.expect;

  // @ts-ignore
  global.expect = function rootCauseExpect(...args: any[]) {
    const forStackTrace = { stack: '' };
    Error.captureStackTrace(forStackTrace, rootCauseExpect);
    const matcherStartHandler = expectStartHandler(args, forStackTrace.stack);
    return wrapExpectReturnOrModifier(originalExpect(...args), matcherStartHandler);
  };

  Object.keys(originalExpect).forEach((prop) => {
    // @ts-ignore
    global.expect[prop] = originalExpect[prop];
  });

  let alreadyUnhooked = false;

  return function unhook() {
    if (alreadyUnhooked) {
      throw new Error('Developer error: already unhooked');
    }

    alreadyUnhooked = true;
    // @ts-ignore
    global.expect = originalExpect;
  };
}

function wrapExpectReturnOrModifier(expectReturnResult: ExpectReturnType, matcherStartHandler: MatcherStartHandler) {
  return new Proxy(expectReturnResult, new ExpectReturnProxyHandler('root', matcherStartHandler));
}

class ExpectReturnProxyHandler implements ProxyHandler<ExpectReturnType> {
  constructor(
    private currentModifier: typeof matchersModifiers[number] | 'root',
    private matcherStartHandler: MatcherStartHandler
  ) {}

  get = (target: ExpectReturnType, matcherNameOrModifier: PropertyKey, receiver: any): any => {
    if (this.currentModifier === 'root') {
      if (isMatcherModifier(matcherNameOrModifier)) {
        return new Proxy(
          target[matcherNameOrModifier],
          new ExpectReturnProxyHandler(matcherNameOrModifier, this.matcherStartHandler)
        );
      }
    }

    // @ts-ignore
    const theMatcherFunction = target[matcherNameOrModifier];

    // We expect to handle only functions from here on
    if (typeof theMatcherFunction !== 'function' || typeof matcherNameOrModifier !== 'string') {
      return theMatcherFunction;
    }

    const { matcherStartHandler, currentModifier } = this;

    return function wrappedFunction(...args: any[]) {
      const matcherEndHandler = matcherStartHandler(matcherNameOrModifier, args, currentModifier);

      try {
        const returnValue = theMatcherFunction(...args);

        if (!isPromise(returnValue)) {
          matcherEndHandler.sync({ success: true });

          return returnValue;
        }

        return returnValue.then(
          async (resolveValue) => {
            await matcherEndHandler.async({ success: true });
            return resolveValue;
          },
          async (error) => {
            await matcherEndHandler.async({ success: false, error });
            return Promise.reject(error);
          }
        );
      } catch (error) {
        matcherEndHandler.sync({ success: false, error });
        throw error;
      }
    };
  };
}

function isPromise(maybePromise: unknown): maybePromise is Promise<unknown> {
  if (
    maybePromise &&
    // @ts-expect-error
    typeof maybePromise.then === 'function'
  ) {
    return true;
  }

  return false;
}

// for reference
// expect puppeteer matchers
// const pageMatchers = {
//     toClick,
//     toDisplayDialog,
//     toFill,
//     toFillForm,
//     toMatch,
//     toMatchElement,
//     toSelect,
//     toUploadFile,
//     not: {
//       toMatch: notToMatch,
//       toMatchElement: notToMatchElement,
//     },
//   }

//   const elementHandleMatchers = {
//     toClick,
//     toFill,
//     toFillForm,
//     toMatch,
//     toMatchElement,
//     toSelect,
//     toUploadFile,
//     not: {
//       toMatch: notToMatch,
//       toMatchElement: notToMatchElement,
//     },
//   }
