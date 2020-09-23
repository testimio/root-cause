import { Page } from 'puppeteer';

const firstArg = (args: any[]) => args[0];
type SelectorMapping = { [P in keyof Page]?: (args: any[]) => string | undefined };

export const extractPuppeteerSelectorMapping = ({
  $: firstArg,
  $$: firstArg,
  $$eval: firstArg,
  $eval: firstArg,
  $x: Function.prototype, // TODO(Benji) supporting xpath here should be pretty easy
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
} as const) as SelectorMapping;

export function extractPuppeteerSelector(fnName: keyof Page, args: any[]): string | undefined {
  const extractor = extractPuppeteerSelectorMapping[fnName] || (() => undefined);
  return extractor(args);
}
