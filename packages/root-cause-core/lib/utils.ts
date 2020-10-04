import type { AbortSignal } from 'abort-controller';
import type { DevtoolsProtocolResponseMap } from './nicerChromeDevToolsTypes';
import type { RootCausePage } from './interfaces';
import type { StartTestParams } from './attachInterfaces';
import crypto from 'crypto';
import path from 'path';
import { RESULTS_DIR_NAME, RUNS_DIR_NAME } from './consts';
import fs from 'fs-extra';
import type {
  CDPSession,
  Page as PuppeteerPage,
  PageEventObj as PuppeteerPageEventObj,
} from 'puppeteer';
import type {
  Page as PlaywrightPage,
  ChromiumBrowserContext,
  BrowserContext,
  ChromiumBrowser,
} from 'playwright';
import type { TestSystemInfo, CodeLocationDetails, StepError } from '@testim/root-cause-types';
import type { StackLineData, CallSite } from 'stack-utils';
import StackUtils from 'stack-utils';

const USER_CODE_BEFORE_AFTER_TO_SHOW = 3;

const stackUtils = new StackUtils({ cwd: process.cwd(), internals: StackUtils.nodeInternals() });

export function captureStacktraceDetails(): { stackLines: StackLineData[]; stacktrace: string } {
  // stackUtils.capture have some wired issues with line numbers
  // callSites: stackUtils.capture(captureStacktraceDetails),

  const stacktrace = stackUtils.captureString(captureStacktraceDetails);
  const stackLines = stackUtils
    .captureString(captureStacktraceDetails)
    .split(/\r?\n/)
    .map((line) => stackUtils.parseLine(line))
    .filter(nonNullable);

  return {
    stackLines,
    stacktrace,
  };
}

// Avoid depending of TypeScript dom symbols
declare const navigator: any;
declare const window: any;

export function testResultDirFromStartParams(startParams: StartTestParams) {
  const uniqueTestId = testUniqueIdentifierFromStartParams(startParams);

  return path.resolve(
    constructTestInvocationResultDir(startParams.projectRoot, startParams.runId),
    uniqueTestId
  );
}

export function constructTestInvocationResultDir(projectRoot: string, runId: string) {
  return path.resolve(constructResultDir(projectRoot), RUNS_DIR_NAME, runId);
}

export function constructTestResultDir(projectRoot: string, runId: string, testId: string) {
  return path.resolve(constructResultDir(projectRoot), RUNS_DIR_NAME, runId, testId);
}

export function constructResultDir(projectRoot: string) {
  return path.resolve(projectRoot, RESULTS_DIR_NAME);
}

export function testUniqueIdentifierFromStartParams(startParams: {
  projectRoot: string;
  fullSuitePath: string;
  fullName: string;
}) {
  /**
   * we remove the projectRoot because this value is changing between machines.
   * that way we can have consistent ids across machines
   * if any problems arise we can change that
   */
  const onlyInterestingPath = path.relative(startParams.projectRoot, startParams.fullSuitePath);
  const str = `${onlyInterestingPath}-${startParams.fullName}`;
  return crypto.createHash('md5').update(str).digest('hex');
}

// find something better? for now we are cool
export function isNotPlaywrightPage(page: RootCausePage): page is PuppeteerPage {
  return !('exposeBinding' in page);
}

export function isPlaywrightChromiumBrowserContext(
  context: BrowserContext
): context is ChromiumBrowserContext {
  // https://github.com/microsoft/playwright/blob/807dc1f3248571f5dcb13731c14b349e47c6e868/docs/api.md#chromiumbrowsercontextnewcdpsessionpage
  return 'newCDPSession' in context;
}

export async function getSystemInfoForPage(page: RootCausePage): Promise<TestSystemInfo> {
  if (isNotPlaywrightPage(page)) {
    return getSystemInfoForPuppeteerPage(page);
  }

  return getSystemInfoForPlaywrightPage(page);
}

export async function getSystemInfoForPlaywrightPage(
  page: PlaywrightPage
): Promise<TestSystemInfo> {
  const context = page.context();

  if (isPlaywrightChromiumBrowserContext(context)) {
    return getSystemInfoForPlaywrightChromiumPage(page, context);
  }

  const browserPlatform = await page.evaluate(() => navigator.platform);
  const pageViewport =
    page.viewportSize() ||
    (await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    })));
  const userAgent = await page.evaluate(() => navigator.userAgent);

  return {
    automationFramework: 'playwright',
    browser: context.constructor.name === 'FFBrowserContext' ? 'firefox' : 'webkit',
    pageViewport,
    userAgent,
    browserPlatform,
    modelName: 'N/A',
    modelVersion: 'N/A',
    browserVersion: 'N/A',
  };
}

export async function getSystemInfoForPlaywrightChromiumPage(
  page: PlaywrightPage,
  context: ChromiumBrowserContext
): Promise<TestSystemInfo> {
  // dirty, but working
  // @ts-expect-error
  const crBrowser: ChromiumBrowser = context._browser;
  const cdpSession = await crBrowser.newBrowserCDPSession();
  const systemInfo: DevtoolsProtocolResponseMap['SystemInfo.getInfo'] = (await cdpSession.send(
    'SystemInfo.getInfo'
  )) as DevtoolsProtocolResponseMap['SystemInfo.getInfo'];
  const { modelName, modelVersion } = systemInfo;

  const browserPlatform = await page.evaluate(() => navigator.platform);
  const pageViewport =
    page.viewportSize() ||
    (await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    })));

  const userAgent = await page.evaluate(() => navigator.userAgent);
  const browserVersion = 'N/A';

  return {
    automationFramework: 'playwright',
    browser: 'chromium',
    pageViewport,
    userAgent,
    browserVersion,
    modelName,
    modelVersion,
    browserPlatform,
  };
}

export async function getSystemInfoForPuppeteerPage(page: PuppeteerPage): Promise<TestSystemInfo> {
  const browser = page.browser();
  const browserPlatform = await page.evaluate(() => navigator.platform);
  const pageViewport = page.viewport();
  const userAgent = await browser.userAgent();
  const browserVersion = await browser.version();
  const browserTarget = browser.target();

  const cdpSession = await browserTarget.createCDPSession();
  // https://chromedevtools.github.io/devtools-protocol/tot/SystemInfo/#type-ProcessInfo
  const systemInfo: DevtoolsProtocolResponseMap['SystemInfo.getInfo'] = (await cdpSession.send(
    'SystemInfo.getInfo'
  )) as DevtoolsProtocolResponseMap['SystemInfo.getInfo'];

  const { modelName, modelVersion } = systemInfo;

  return {
    automationFramework: 'puppeteer',
    browser: 'chromium',
    pageViewport,
    userAgent,
    browserVersion,
    modelName,
    modelVersion,
    browserPlatform,
  };
}

export function isChromeCDPSession(session: unknown): session is CDPSession {
  return session && typeof (session as CDPSession).send === 'function';
}

/**
 * User agents are less and less reliable these days
 *
 * @param userAgent
 */
export function guessOperatingSystemUserAgent(): { name: string; version: string } {
  return {
    name: 'N/A',
    version: 'N/A',
  };
}

export function assertNotNullOrUndefined<T>(
  value: T
): asserts value is Exclude<T, undefined | null | void> {
  if (value === undefined || value === null) {
    throw new Error('value is nullable');
  }
}

export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

export function sleep(time: number, abortSignal?: AbortSignal) {
  return new Promise<void>((res, rej) => {
    if (abortSignal?.aborted) {
      rej(new AbortError());
      return;
    }

    if (abortSignal) {
      abortSignal.addEventListener('abort', onAbort);
    }

    const timeoutHandle = setTimeout(timeoutCallback, time);

    function timeoutCallback() {
      if (abortSignal) {
        abortSignal.removeEventListener('abort', onAbort);
      }
      res();
    }

    function onAbort() {
      clearTimeout(timeoutHandle);
      if (abortSignal) {
        abortSignal.removeEventListener('abort', onAbort);
      }
      rej(new AbortError());
    }
  });
}

export class AbortError extends Error {
  public name: 'AbortError' = 'AbortError';
}

export function isAbortError(maybeAbortError: unknown): maybeAbortError is AbortError {
  return maybeAbortError instanceof Error && maybeAbortError.name === 'AbortError';
}

export function unknownValueThatIsProbablyErrorToStepError(probablyError: unknown): StepError {
  let errorToReturn: StepError;

  if (probablyError instanceof Error) {
    errorToReturn = {
      name: probablyError.name,
      message: probablyError.message,
      stack: probablyError.stack,
    };
  } else if (
    typeof probablyError === 'object' &&
    probablyError !== null &&
    'message' in probablyError &&
    'name' in probablyError
  ) {
    errorToReturn = {
      // @ts-expect-error
      name: probablyError.name,
      // @ts-expect-error
      message: probablyError.message,
      // @ts-expect-error
      stack: probablyError.stack ?? undefined,
    };
  } else {
    errorToReturn = {
      name: 'Unknown error',
      message: 'Unknown error',
    };
  }

  return errorToReturn;
}

/**
 * Very crud, but effective way to get rid of values that we don't mock and might change between envs running the test
 */
const noiseKeys = new Set([
  'userAgent',
  'modelName',
  'modelVersion',
  'browserPlatform',
  'branchInfo',
]);
export function jsonRemoveNoiseReviver(key: string, value: any) {
  if (noiseKeys.has(key)) {
    return `noise_removed:${key}`;
  }

  return value;
}

const noiseReducers = {
  rect(rect: any): any {
    return fromEntries(Object.entries(rect).map(([key]) => [key, 'possible noise removed']));
  },
};

export function jsonReduceNoiseReviver(key: string, value: any) {
  if (key in noiseReducers) {
    // @ts-ignore
    return noiseReducers[key](value);
  }

  if (noiseKeys.has(key)) {
    return `noise_removed:${key}`;
  }

  return value;
}

export function removeStringFromString(strToRemove: string, strToRemoveFrom: string): string {
  return strToRemoveFrom.split(strToRemove).join('');
}

export async function readJsonTestSnapshotFile(filePath: string) {
  const str = await fs.readFile(filePath, 'utf8');
  return JSON.parse(str, jsonReduceNoiseReviver);
}

export function removeStringFromStringAndParse(
  strToRemove: string,
  strToRemoveFrom: string,
  reviver?: ((this: any, key: string, value: any) => any) | undefined
) {
  return JSON.parse(removeStringFromString(strToRemove, strToRemoveFrom), reviver);
}

/**
 * Object.fromEntries is not available
 */
function fromEntries(iterable: Iterable<[string, unknown]>) {
  return [...iterable].reduce((obj, [key, val]) => {
    obj[key] = val;
    return obj;
  }, {} as any);
}

export function arrayFlat<T>(arr: T[][]): T[] {
  return arr.reduce<T[]>((prev, curr) => {
    prev.push(...curr);
    return prev;
  }, []);
}

const stackFramesToFilter = [
  'PuppeteerPageHooker.makeStep',
  'stacktraceHook',
  'extractCodeLocationDetailsSync',
];

export function extractCodeLocationDetailsSync(
  userTestFile: string,
  workingDirectory: string
): CodeLocationDetails {
  const { stackLines /*, stacktrace*/ } = captureStacktraceDetails();

  const callSitesInUserCode = stackLines.filter((site) => {
    const callSiteFileName = site.file;

    if (site.function && stackFramesToFilter.includes(site.function)) {
      return false;
    }

    if (!callSiteFileName) {
      return false;
    }

    return userTestFile.endsWith(callSiteFileName);
  });

  // User code might have more than one lines in the stack
  // we assume that the first line is the actual test code and not helper function
  // That's might be not true in some cases
  const userTestCodeLine = callSitesInUserCode[0];

  assertNotNullOrUndefined(userTestCodeLine.line);
  assertNotNullOrUndefined(userTestCodeLine.column);
  assertNotNullOrUndefined(userTestCodeLine.file);

  // todo: cache file contents?
  const userTestFileContent = fs.readFileSync(userTestFile, 'utf8');
  const userTestFileCodeLines = userTestFileContent.split(/\r?\n/);
  const fromRowNumber = Math.max(userTestCodeLine.line - USER_CODE_BEFORE_AFTER_TO_SHOW, 1);
  const toRowNumber = Math.min(
    userTestCodeLine.line + USER_CODE_BEFORE_AFTER_TO_SHOW,
    userTestFileCodeLines.length
  );

  const codeLines = userTestFileCodeLines.slice(fromRowNumber - 1, toRowNumber);

  const callstack = stackLines
    .filter((line) => {
      const { function: functionName } = line;
      if (functionName && stackFramesToFilter.some((frame) => functionName.includes(frame))) {
        return false;
      }

      return true;
    })
    .map((line) => ({
      ...line,
      file: line.file ? path.relative(workingDirectory, line.file) : undefined,
    }));

  return {
    sourceFileRelativePath: userTestFile.substring(process.cwd().length + 1),
    codeLines,
    fromRowNumber,
    toRowNumber,
    row: userTestCodeLine.line,
    column: userTestCodeLine.column,
    callstack,
  };
}

export function isPromise(maybePromise: unknown): maybePromise is Promise<unknown> {
  return (
    typeof maybePromise === 'object' &&
    maybePromise !== null &&
    // @ts-ignore
    typeof maybePromise.then === 'function'
  );
}

export function puppeteerAddEventReturnDisposer<TEventName extends keyof PuppeteerPageEventObj>(
  page: PuppeteerPage,
  eventName: TEventName,
  handler: (e: PuppeteerPageEventObj[TEventName], ...args: any[]) => unknown
) {
  page.on(eventName, handler);

  return function dispose() {
    page.off(eventName, handler);
  };
}

const moreNodeBuiltin = ['assert.js', 'internal/process'];

export function getSelfCallSiteFromStacktrace(howManyBack = 1): CallSite | null {
  const noneInternalLines = stackUtils.capture(getSelfCallSiteFromStacktrace).filter((line) => {
    if (line.isNative()) {
      return false;
    }

    const fileName = line.getFileName() || '';

    return moreNodeBuiltin.every((builtin) => !fileName.includes(builtin));
  });

  if (howManyBack >= noneInternalLines.length) {
    // Note:
    // In case that the caller dose not have 'await', async stack trace will not be added, and in node 10.
    // that can case issues, so we return null
    return null;
  }

  return noneInternalLines[howManyBack];
}

export function getLast<T>(items: T[]) {
  return items[items.length - 1];
}

export function setFunctionName(func: Function, newName: string) {
  Object.defineProperty(func, 'name', {
    value: newName,
    writable: false,
  });

  return func;
}

export function appendToFunctionName(func: Function, append: string) {
  return setFunctionName(func, `${func.name}${append}`);
}
