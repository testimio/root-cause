import { ElementHandle, Frame, Keyboard, Mouse, Page } from 'puppeteer';

type SelectorMapper = (args: any[]) => string | undefined;

type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type SelectorMappingOf<T> = {
  [K in FunctionPropertyNames<T>]: SelectorMapper;
};

interface SelectorMapping {
  Page: SelectorMappingOf<Page>;
  ElementHandle: SelectorMappingOf<ElementHandle>;
  Keyboard: SelectorMappingOf<Keyboard>;
  Mouse: SelectorMappingOf<Mouse>;
  Frame: SelectorMappingOf<Frame>;
}

const firstArg: SelectorMapper = (args: any[]) => args[0];
const firstArgIfString: SelectorMapper = (args: any[]) => {
  if (typeof args[0] === 'string') {
    return args[0];
  }
  return undefined;
};

const commonSelectorMapping: Record<string, SelectorMapper> = {
  $: firstArg,
  $$: firstArg,
  $$eval: firstArg,
  $eval: firstArg,
  // $x: Function.prototype, // TODO(Benji) supporting xpath here should be pretty easy
  focus: firstArg,
  hover: firstArg,
  click: firstArg,
  type: firstArg,
  tap: firstArg,
  select: firstArg,
};

const selectorMapping: SelectorMapping = {
  Page: {
    ...commonSelectorMapping,
    waitFor: firstArgIfString,
    waitForSelector: firstArg,
  } as SelectorMappingOf<Page>, // Hack to not have to make the list exhaustive
  ElementHandle: {
    ...commonSelectorMapping,
  } as SelectorMappingOf<ElementHandle>,
  Keyboard: {} as SelectorMappingOf<Keyboard>,
  Mouse: {} as SelectorMappingOf<Mouse>,
  Frame: {
    ...commonSelectorMapping,
    waitFor: firstArgIfString,
    waitForSelector: firstArg,
  } as SelectorMappingOf<Frame>,
};

export function extractPuppeteerSelector(
  puppeteerObject: object,
  fnName: string,
  args: any[]
): string | undefined {
  const type = puppeteerObject.constructor.name;

  // @ts-ignore typing gets weird here, says result of ?.[fnName] is unknown
  const selector: string | undefined = selectorMapping[type]?.[fnName]?.(args);
  // if (!selector) {
  //   console.error(`Could not find selector for ${type}.${fnName}(${args})`);
  // }
  return selector;
}
