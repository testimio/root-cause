import { ElementHandle, Keyboard, Mouse, Page } from 'puppeteer';

const firstArg = (args: any[]) => args[0];

type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type SelectorMappingOf<T> = {
  [K in FunctionPropertyNames<T>]: (args: any[]) => string | undefined;
};

interface SelectorMapping {
  Page: SelectorMappingOf<Page>;
  ElementHandle: SelectorMappingOf<ElementHandle>;
  Keyboard: SelectorMappingOf<Keyboard>;
  Mouse: SelectorMappingOf<Mouse>;
}

const selectorMapping: SelectorMapping = {
  Page: {
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
    waitFor(args: any[]) {
      if (typeof args[0] === 'string') {
        return args[0];
      }
      return undefined;
    },
    waitForSelector: firstArg,
  } as SelectorMappingOf<Page>, // Hack to not have to make the list exhaustive
  ElementHandle: {
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
  } as SelectorMappingOf<ElementHandle>,
  Keyboard: {} as SelectorMappingOf<Keyboard>,
  Mouse: {} as SelectorMappingOf<Mouse>,
};

export function extractPuppeteerSelector(
  puppeteerObject: object,
  fnName: string,
  args: any[]
): string | undefined {
  const type = puppeteerObject.constructor.name;

  // @ts-ignore typing gets weird here, says result of ?.[fnName] is unknown
  return selectorMapping[type]?.[fnName]?.(args);
}
