import type { AssertionReport } from '@testim/root-cause-core';
import { utils } from '@testim/root-cause-core';
import nodeUtils from 'util';
import { IS_NODE_10 } from '@testim/root-cause-core/lib/consts';

const DEFAULT_STRING_REPRESENTATION_TAIL_SIZE = 7;
const DEFAULT_BEST_EFFORT_LENGTH = 40;
const STRING_TAIL_SEPARATOR = '...';

// Local feature flag; the output of inspect is too long atm, need to revisit before enabling
const USE_INSPECT = false;

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
export function expectDataToAssertionReport(
  expectData: ExpectData
): Omit<AssertionReport, 'codeError'> {
  // const name = `expect(expected)${expectData.modifier ? `.${expectData.modifier}` : ''}.${
  //     expectData.matcherName
  // }(actual)`;

  const expectArgsAsStrings = expectData.expectArgs.map((arg) =>
    javascriptValueToVisualTextualRepresentation(arg)
  );

  const matcherArgsAsStrings = expectData.matcherArgs.map((arg) =>
    javascriptValueToVisualTextualRepresentation(arg)
  );

  const text = `expect(${expectArgsAsStrings.join(', ')})${
    expectData.modifier ? `.${expectData.modifier}` : ''
  }.${expectData.matcherName}(${matcherArgsAsStrings})`;

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
      const part1 = value.substr(
        0,
        bestEffortMaxLength - STRING_TAIL_SEPARATOR.length - stringTailSize
      );
      const part2 = value.substr(-stringTailSize);
      return `${part1}${STRING_TAIL_SEPARATOR}${part2}`;
    }

    return value;
  }

  if (Array.isArray(value)) {
    if (IS_NODE_10 || !USE_INSPECT) {
      return `Array(length=${value.length})`;
    }

    // @ts-expect-error we are with node 10 types, that dose not support maxStringLength
    return nodeUtils.inspect(value, {
      maxStringLength: bestEffortMaxLength,
    });
  }

  if (utils.isPromise(value)) {
    // We are sync function, we can't extract promises
    if (IS_NODE_10 || !USE_INSPECT) {
      return 'Promise';
    }

    // @ts-expect-error we are with node 10 types, that dose not support maxStringLength
    return nodeUtils.inspect(value, {
      maxStringLength: bestEffortMaxLength,
    });
  }

  if (typeof value === 'object' && value !== null && value.constructor.name !== 'Object') {
    /*
            There's special jest classes, called AsymmetricMatcher.
            https://github.com/facebook/jest/blob/v26.1.0/packages/expect/src/asymmetricMatchers.ts
            We may add special handling for it later
         */
    if (IS_NODE_10 || !USE_INSPECT) {
      return `instanceof(${value.constructor.name})`;
    }

    // @ts-expect-error we are with node 10 types, that dose not support maxStringLength
    return nodeUtils.inspect(value, {
      maxStringLength: bestEffortMaxLength,
    });
  }

  // fallback value
  if (IS_NODE_10 || !USE_INSPECT) {
    return 'object';
  }

  // @ts-expect-error we are with node 10 types, that dose not support maxStringLength
  return nodeUtils.inspect(value, {
    maxStringLength: bestEffortMaxLength,
  });
}
