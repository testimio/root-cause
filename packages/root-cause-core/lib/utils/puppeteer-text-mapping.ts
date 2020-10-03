import { ElementHandle, Frame, Keyboard, Mouse } from 'puppeteer';
import { RootCausePage } from '../interfaces';

type TextExtractor = (args: any[], returnValue: any) => string | undefined;

type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type TextMappingOf<T> = Partial<
  {
    [K in FunctionPropertyNames<T>]: TextExtractor;
  }
>;

interface TextMapping {
  Page: TextMappingOf<RootCausePage>;
  ElementHandle: TextMappingOf<ElementHandle>;
  Keyboard: TextMappingOf<Keyboard>;
  Mouse: TextMappingOf<Mouse>;
  Frame: TextMappingOf<Frame>;
}

const secondArg: TextExtractor = (args: any[]) => args[1];
const firstArg: TextExtractor = (args: any[]) => args[0];
const returnValue: TextExtractor = (_: any[], returnValue: any) =>
  typeof returnValue === 'string' ? returnValue : undefined;

const textMapping: TextMapping = {
  Page: {
    type: secondArg,
    evaluate: returnValue,
    goto: firstArg,
    $eval: returnValue,
  },
  ElementHandle: {
    type: firstArg,
    getProperty: firstArg,
  },
  Keyboard: {
    press: firstArg,
    type: firstArg,
  },
  Mouse: {
    move: JSON.stringify,
    click: JSON.stringify,
    down: JSON.stringify,
    up: JSON.stringify,
  },
  Frame: {
    focus: firstArg,
    type: secondArg,
  },
};

export function extractPuppeteerText(
  puppeteerObject: object,
  fnName: string,
  args: any[],
  returnValue: any
): string | undefined {
  const type = puppeteerObject.constructor.name;

  // @ts-ignore typing gets weird here, says result of ?.[fnName] is unknown
  return textMapping[type]?.[fnName]?.(args, returnValue);
}
