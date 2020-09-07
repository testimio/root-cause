export type InstrumentedFunctionResult<T, E> =
    | { success: true; data?: T }
    | { success: false; error: E };

export type TestEndStatus<T, E> = InstrumentedFunctionResult<T, E>;

export interface RunHistoryRecord {
    runId: string;
    // somekind of redundancy. we can read it from the RunConclusionFile. might remove?
    timestamp: number;
    // read more data from RunConclusionFile, or we may inline more data here
}

export interface RunConclusionFile {
    // Somekind of redundancy. We may compute it from path
    runId: string;

    // somekind of redundancy. might remove one day. we have it in RunHistoryRecord as well
    timestamp: number;
    tests: Array<{
        // for more granular info, read the actual test result file
        id: string;
        name: string;
        reason?: string;
        suiteFilePath: string;
        fullName: string;
        // jest actually have more possible test status, but we ignore not failed / passed for now
        // declare type Status = 'passed' | 'failed' | 'skipped' | 'pending' | 'todo' | 'disabled';
        success: boolean;
        timestamp: number;
        endedTimestamp: number;
    }>;
}

export interface TestSystemInfo {
    automationFramework: 'playwright' | 'puppeteer';

    browser: 'chromium' | 'firefox' | 'webkit';

    /**
     * limitation:
     * Might be not correct for all pages if we have test with several pages
     */
    pageViewport: PageViewport;

    userAgent: string;

    /**
     * HeadlessChrome/84.0.4143.2
     */
    browserVersion: string;

    /**
     * A platform-dependent description of the model of the machine. On Mac OS, this is, for example, 'MacBookPro'. Will be the empty string if not supported.
     */
    modelName: string;

    /**
     * A platform-dependent description of the version of the machine. On Mac OS, this is, for example, '10.1'. Will be the empty string if not supported.
     */
    modelVersion: string;

    /**
     * For example: "MacIntel", "Win32", "FreeBSD i386", "WebTV OS"
     * https://developer.mozilla.org/en-US/docs/Web/API/NavigatorID/platform
     */
    browserPlatform: string;
}

/**
 * Based on puppeteer one.
 * Playwright have only width & height, the rest is optional
 *
 * Maybe we don't care about it all, or other FW won't have them all.
 * We can change it in the future
 */
export interface PageViewport {
    /** The page width in pixels. */
    width: number;

    /** The page height in pixels. */
    height: number;

    /**
     * Specify device scale factor (can be thought of as dpr).
     * @default 1
     */
    deviceScaleFactor?: number;

    /**
     * Whether the `meta viewport` tag is taken into account.
     * @default false
     */
    isMobile?: boolean;

    /**
     * Specifies if viewport supports touch events.
     * @default false
     */
    hasTouch?: boolean;

    /**
     * Specifies if viewport is in landscape mode.
     * @default false
     */
    isLandscape?: boolean;
}

export interface TestResultFile {
    metadata: TestMetadata;
    steps: StepResult[];
}

export type StepError = {
    message: string;
    name: string;
    stack?: string;
};

export type StepResult = {
    name?: string;
    screenshot?: string;
    selector?: string;
    fnName?: string;
    text?: string;

    index: number;
    startTimestamp: number;
    endTimestamp?: number;
    consoleEntries?: ConsoleMessage[];
    unhandledExceptions?: ConsoleException[];

    /**
     * Exception that was thrown inside the step,
     * this is not guarantee that the test is going to fail here
     */
    stepError?: StepError;

    stepCodeLocation?: CodeLocationDetails;

    /**
     * @deprecated
     * for backward compatibility
     */
    codeError?: CodeLocationDetails;
} & HasRectangle;

export type HasRectangle = {
    rect?: DOMRect & { screenWidth: number; screenHeight: number; devicePixelRatio: number };
};

export interface CodeLocationDetails {
    /**
     * Relative(!!) path for test file from working directory
     * Old versions will not have this one
     * In some cases, this might not be as TestContext testFullName
     */
    sourceFileRelativePath: string;

    codeLines: string[];
    /**
     * @deprecated
     * for backward compat
     */
    errorLines?: string[];
    fromRowNumber: number;
    toRowNumber: number;
    row: number;
    column: number;
}

export interface TestMetadata {
    /**
     * The final part test name / description
     * Or other provided value by the integrator
     * examples:
     * ```
     * it("testName", () => ...)
     * test("testName", () => ...)
     * ```
     */
    testName: string;
    /**
     * Concatenated string of the entire describes stack
     * Or other provided value by the integrator.
     *
     * example:
     * ```
     * describe("Global tests", () => {
     *  describe("part 1", () => {
     *   test("testName", () => ...)
     *  })
     * });
     * ```
     */
    testFullName: string;
    systemInfo?: TestSystemInfo;
    testEndStatus?: TestEndStatus<unknown, StepError>;
    fileName: string;
    branchInfo?: {
        commitHash: string;
        branchName: string;
    };
    timestamp: number;
    endedTimestamp: number;
    hasNetworkLogs?: boolean;
}

/**
 * Puppeteer actually sends Error object with stack trace inside the message string
 * See https://github.com/puppeteer/puppeteer/blob/v3.1.0/src/helper.ts#L37-L58
 */
export interface ConsoleException {
    message: string;
    timestamp: number;
    stack?: string;
}

/*
 ref https://chromedevtools.github.io/devtools-protocol/tot/Console/#type-ConsoleMessage
 https://github.com/puppeteer/puppeteer/blob/v3.1.0/docs/api.md#class-consolemessage
 https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#event-consoleAPICalled
 We omit the js handle part
 https://github.com/puppeteer/puppeteer/blob/v3.1.0/docs/api.md#consolemessageargs
*/
export interface ConsoleMessage {
    // not available from puppeteer, but does in CDP
    //     Message source.
    // Allowed Values: xml, javascript, network, console-api, storage, appcache, rendering, security, other, deprecation, worker
    // source: string;

    // Message severity.
    // level: 'log' |
    //     'debug' |
    //     'info' |
    //     'error' |
    //     'warning' |
    //     'dir' |
    //     'dirxml' |
    //     'table' |
    //     'trace' |
    //     'clear' |
    //     'startGroup' |
    //     'startGroupCollapsed' |
    //     'endGroup' |
    //     'assert' |
    //     'profile' |
    //     'profileEnd' |
    //     'count' |
    //     'timeEnd';

    // https://github.com/puppeteer/puppeteer/blob/v5.0.0/src/common/Page.ts#L521-L529
    // https://github.com/microsoft/playwright/blob/2a86ead0acc7baedd93aa79ad0811b16d04abfe9/src/console.ts#L21
    // we don't have stack trace here, puppeteer & playwright won't pass them
    // stacktrace is not available

    /**
     * puppeteer have these string values in types, playwright type is string, but with types in jsdoc comment.
     * The middle ground is string
     *
     * One of the following values: `'log'`,
     * `'debug'`,
     * `'info'`,
     * `'error'`,
     * `'warning'`,
     * `'dir'`,
     * `'dirxml'`,
     * `'table'`,
     * `'trace'`,
     * `'clear'`,
     * `'startGroup'`,
     * `'startGroupCollapsed'`,
     * `'endGroup'`,
     * `'assert'`,
     * `'profile'`,
     * `'profileEnd'`,
     * `'count'`,
     * `'timeEnd'`.
     */
    level: string;

    text: string;
    //     URL of the message origin.
    url?: string;
    line?: number;
    column?: number;
    timestamp: number;
    args?: string[];
}

/**
 * Compatible with typescript DOM lib
 * this is here so we won't need to load dom lib into the typescript program
 */
export interface DOMRect extends DOMRectReadOnly {
    height: number;
    width: number;
    x: number;
    y: number;
}

/**
 * Compatible with typescript DOM lib
 * this is here so we won't need to load dom lib into the typescript program
 */
export interface DOMRectReadOnly {
    readonly bottom: number;
    readonly height: number;
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly width: number;
    readonly x: number;
    readonly y: number;
    toJSON(): any;
}

export interface RunnerResultEntry {
    testResult: AgnosticResultEntry;
    suiteFilePath: string;
    id: string;
}

export interface AgnosticResultEntry {
    title: string;
    fullName: string;
    status: 'passed' | 'failed' | 'skipped' | 'pending' | 'todo' | 'disabled';
}
