import type { AbortSignal } from 'abort-controller';
import type { DevtoolsProtocolResponseMap } from './nicerChromeDevToolsTypes';
import type { RootCausePage } from './interfaces';
import { StartTestParams } from './attachInterfaces';
import crypto from 'crypto';
import path from 'path';
import { RESULTS_DIR_NAME, RUNS_DIR_NAME } from './consts';
import fs from 'fs-extra';
import type { Page as PuppeteerPage, PageEventObj as PuppeteerPageEventObj } from 'puppeteer';
import type { Page as PlaywrightPage, ChromiumBrowserContext, BrowserContext, ChromiumBrowser } from 'playwright';
import type { TestSystemInfo, ICodeErrorDetails } from '@testim/root-cause-types';

// Avoid depending of TypeScript dom symbols
declare const navigator: any;
declare const window: any;

export function testResultDirFromStartParams(startParams: StartTestParams) {
    const uniqueTestId = testUniqueIdentifierFromStartParams(startParams);

    return path.resolve(constructTestInvocationResultDir(startParams.projectRoot, startParams.runId), uniqueTestId);
}

export function constructTestInvocationResultDir(projectRoot: string, runId: string) {
    return path.resolve(constructScreenplayResultDir(projectRoot), RUNS_DIR_NAME, runId);
}

export function constructTestResultDir(projectRoot: string, runId: string, testId: string) {
    return path.resolve(constructScreenplayResultDir(projectRoot), RUNS_DIR_NAME, runId, testId);
}

export function constructScreenplayResultDir(projectRoot: string) {
    return path.resolve(projectRoot, RESULTS_DIR_NAME);
}

export function testUniqueIdentifierFromStartParams(startParams: { projectRoot: string; fullSuitePath: string; fullName: string }) {
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


export function isPlaywrightChromiumBrowserContext(context: BrowserContext): context is ChromiumBrowserContext {
    // https://github.com/microsoft/playwright/blob/807dc1f3248571f5dcb13731c14b349e47c6e868/docs/api.md#chromiumbrowsercontextnewcdpsessionpage
    return 'newCDPSession' in context;
}

export async function getSystemInfoForPage(page: RootCausePage): Promise<TestSystemInfo> {
    if (isNotPlaywrightPage(page)) {
        return getSystemInfoForPuppeteerPage(page);
    }

    return getSystemInfoForPlaywrightPage(page);
}

export async function getSystemInfoForPlaywrightPage(page: PlaywrightPage): Promise<TestSystemInfo> {
    const context = page.context();

    if (isPlaywrightChromiumBrowserContext(context)) {
        return getSystemInfoForPlaywrightChromiumPage(page, context);
    }

    const browserPlatform = await page.evaluate(() => navigator.platform);
    const pageViewport = page.viewportSize() || await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
    }));
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

export async function getSystemInfoForPlaywrightChromiumPage(page: PlaywrightPage, context: ChromiumBrowserContext): Promise<TestSystemInfo> {
    // dirty, but working
    // @ts-expect-error
    const crBrowser: ChromiumBrowser = context._browser;
    const cdpSession = await crBrowser.newBrowserCDPSession();
    const systemInfo: DevtoolsProtocolResponseMap['SystemInfo.getInfo'] = await cdpSession.send('SystemInfo.getInfo') as DevtoolsProtocolResponseMap['SystemInfo.getInfo'];
    const { modelName, modelVersion } = systemInfo;

    const browserPlatform = await page.evaluate(() => navigator.platform);
    const pageViewport = page.viewportSize() || await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
    }));

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
    const systemInfo: DevtoolsProtocolResponseMap['SystemInfo.getInfo'] = await cdpSession.send('SystemInfo.getInfo') as DevtoolsProtocolResponseMap['SystemInfo.getInfo'];

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

/**
 * User agents are less and less reliable these days
 *
 * @param userAgent
 */
export function guessOperatingSystemUserAgent(): {name: string; version: string} {
    return {
        name: 'N/A',
        version: 'N/A',
    };
}

export function assertNotNullOrUndefined<T>(value: T): asserts value is Exclude<T, undefined | null | void> {
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

/**
 * Very crud, but effective way to get rid of values that we don't mock and might change between envs running the test
 */
const noiseKeys = new Set(['userAgent', 'modelName', 'modelVersion', 'browserPlatform', 'branchInfo']);
export function jsonRemoveNoiseReviver(key: string, value: any) {
    if (noiseKeys.has(key)) {
        return `noise_removed:${key}`;
    }

    return value;
}

const noiseReducers = {
    rect(rect: any): any {
        return fromEntries(Object.entries(rect).map(([key]) => ([key, 'possible noise removed'])));
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

export function removeStringFromStringAndParse(strToRemove: string, strToRemoveFrom: string, reviver?: ((this: any, key: string, value: any) => any) | undefined) {
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

export async function extractCodeErrorDetails(errorStack: string, assumedUserLine = 3): Promise<ICodeErrorDetails> {
    // remove at processTicksAndRejections (internal/process/task_queues.js:97:5)
    // when we have some other errors in jest, the stack trace looks different...
    const lines = errorStack.split('\n').filter(line => !line.includes('at processTicksAndRejections'));
    // const lineBeforeUserCode = lines.findIndex(l => l.includes('PuppeteerPageHooker'));
    // const userLine = lines[lineBeforeUserCode + 1];

    const userLine = lines[assumedUserLine];
    const firstSlashIndex = userLine.indexOf('/');
    const firstColonIndex = userLine.indexOf(':');
    const filepath = userLine.substr(firstSlashIndex, firstColonIndex - firstSlashIndex);
    const [row, column] = userLine.substr(firstColonIndex + 1).split(':').map(v => v.replace(/[^0-9]/g, '')).map(Number);

    const rowCountToShow = 3;
    const userFile = await fs.readFile(filepath, 'utf8');
    const userLines = userFile.split('\n');
    const fromRowNumber = Math.max(row - rowCountToShow, 1);
    const toRowNumber = Math.min(row + rowCountToShow, userLines.length);

    const errorLines = userLines.slice(fromRowNumber - 1, toRowNumber);

    return {
        errorLines,
        fromRowNumber,
        toRowNumber,
        row,
        column,
    };
}

/**
 * Why do we need a sync variant of extractCodeError?
 * In some cases, like when inside sync matcher of jest, we cannot safely use async apis,
 * as the parent control flow will not wait for us
 * If we want to avoid some of the code redundancy, we can turn it into generator
 */
export function extractCodeErrorDetailsSync(errorStack: string, assumedUserLine = 3): ICodeErrorDetails {
    const lines = errorStack.split('\n');
    // const lineBeforeUserCode = lines.findIndex(l => l.includes('PuppeteerPageHooker'));
    // const userLine = lines[lineBeforeUserCode + 1];
    const userLine = lines[assumedUserLine];
    const firstSlashIndex = userLine.indexOf('/');
    const firstColonIndex = userLine.indexOf(':');
    const filepath = userLine.substr(firstSlashIndex, firstColonIndex - firstSlashIndex);
    const [row, column] = userLine.substr(firstColonIndex + 1).split(':').map(v => v.replace(/[^0-9]/g, '')).map(Number);

    const rowCountToShow = 3;
    const userFile = fs.readFileSync(filepath, 'utf8');
    const userLines = userFile.split('\n');
    const fromRowNumber = Math.max(row - rowCountToShow, 1);
    const toRowNumber = Math.min(row + rowCountToShow, userLines.length);

    const errorLines = userLines.slice(fromRowNumber - 1, toRowNumber);

    return {
        errorLines,
        fromRowNumber,
        toRowNumber,
        row,
        column,
    };
}

export function isPromise(maybePromise: unknown): maybePromise is Promise<unknown> {
    return typeof maybePromise === 'object' && maybePromise !== null &&
        // @ts-ignore
        typeof maybePromise.then === 'function';
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
