import type { AssertionReport } from '@testim/root-cause-core';
import { utils } from '@testim/root-cause-core';

const DEFAULT_STRING_REPRESENTATION_TAIL_SIZE = 7;
const DEFAULT_BEST_EFFORT_LENGTH = 40;
const STRING_TAIL_SEPARATOR = '...';

export interface ExpectData {
  expectArgs: any[];
  modifier?: 'not' | 'rejects' | 'resolves';
  matcherName: string;
  matcherArgs: any[];
  error?: unknown;
}

/**
 * We are not inspecting inside promises here, as it will force us to become async
 * We can consider adding async mode for when we have 'rejects' or 'resolves' modifier in the future.
 */
export function expectDataToAssertionReport(expectData: ExpectData): Omit<AssertionReport, 'codeError'> {
  // const name = `expect(expected)${expectData.modifier ? `.${expectData.modifier}` : ''}.${
  //     expectData.matcherName
  // }(actual)`;

  const text = `expect(${javascriptValueToVisualTextualRepresentation(expectData.expectArgs[0])})${
    expectData.modifier ? `.${expectData.modifier}` : ''
  }.${expectData.matcherName}(${javascriptValueToVisualTextualRepresentation(expectData.matcherArgs[0])})`;

  return {
    name: text,
    // screenshot: undefined,
    // selector: undefined,
    fnName: 'assertion',
    // text,
    // stepError: undefined,
    // rect: undefined,
  };
}

/**
 * Turn arbitrary javascript values to something that will be nice to show in one liner
 * To give the user *some* sense regarding values
 *
 * @param value
 * @param bestEffortMaxLength We will try to make the value string representation shorter than that length
 * @param stringTailSize
 */
export function javascriptValueToVisualTextualRepresentation(
  value: unknown,
  bestEffortMaxLength: number = DEFAULT_BEST_EFFORT_LENGTH,
  stringTailSize: number = DEFAULT_STRING_REPRESENTATION_TAIL_SIZE
): string {
  // eslint-disable-next-line default-case
  switch (typeof value) {
    case 'bigint':
    case 'number':
    case 'boolean':
    case 'symbol':
      return value.toString();

    case 'undefined':
      return 'undefined';

    case 'function':
      return `function ${value.name}`;
  }

  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    if (value.length > bestEffortMaxLength) {
      const part1 = value.substr(0, bestEffortMaxLength - STRING_TAIL_SEPARATOR.length - stringTailSize);
      const part2 = value.substr(-stringTailSize);
      return `${part1}${STRING_TAIL_SEPARATOR}${part2}`;
    }

    return value;
  }

  if (Array.isArray(value)) {
    return `Array(length=${value.length})`;
  }

  // We are sync function, we can't extract promises
  if (utils.isPromise(value)) {
    return 'Promise';
  }

  if (typeof value === 'object' && value !== null && value.constructor.name !== 'Object') {
    /*
            There's special jest classes, called AsymmetricMatcher.
            https://github.com/facebook/jest/blob/v26.1.0/packages/expect/src/asymmetricMatchers.ts
            We may add special handling for it later
         */
    return `instanceof(${value.constructor.name})`;
  }

  // fallback value
  return 'object';
}
