// only types are used from here
import type puppeteer from 'puppeteer';
// only types are used from here
import type playwright from 'playwright';
import { attach } from './attach';
import { StartTestParams } from './attachInterfaces';
import { FALLBACK_RUN_ID } from './consts';
import { updateHistoryFromRootCauseResultsOnly } from './updateHistoryFromRootCauseResultsOnly';
import open from 'open';
import chalk from 'chalk';
import { openServer, closeServer } from './server';
import { TEST_API_PORT } from './envVarsWrapper';
import { testResultDirFromStartParams, getSelfCallSiteFromStacktrace } from './utils';
import { persist } from './persist';
import { loadSettings } from './userSettings/userSettings';

type AutomationLibrary = 'playwright' | 'puppeteer';

interface LaunchOptionsBase<TAutomationLibrary extends AutomationLibrary> {
    testName: string;
    browserOptions?: LaunchOptionsOptionsMap[TAutomationLibrary];
    noServer?: boolean;
    automationLibrary: TAutomationLibrary;
    headless?: boolean;
    // for Testing proposes
    _runId?: string;
}

export type BrowserOptions = PuppeteerBrowserOptions | PlaywrightBrowserOptions;

interface LaunchOptionsOptionsMap {
    puppeteer: PuppeteerBrowserOptions;
    playwright: PlaywrightBrowserOptions;
}

interface AutomationLibraryPageMap {
    puppeteer: puppeteer.Page;
    playwright: playwright.Page;
}

export interface PuppeteerBrowserOptions {
    headless?: boolean;
    browserArgs?: string[];
}

export interface PlaywrightBrowserOptions {
    browser: 'chromium' | 'webkit' | 'firefox';
    headless?: boolean;
    browserArgs?: string[];
}

// we use generic here to pass the correct page type to the userTestFunction
export function launch<TSelectedAutomationLibrary extends AutomationLibrary>(
    options: LaunchOptionsBase<TSelectedAutomationLibrary>,
    userTestFunction: (page: AutomationLibraryPageMap[TSelectedAutomationLibrary]) => Promise<unknown>
) {
    // Hide dateConstructor param
    return launchImpl(options, userTestFunction);
}

/**
 * dateConstructor for test mock purposes
 */
export async function launchImpl<T extends AutomationLibrary>(
    options: LaunchOptionsBase<T>,
    userTestFunction: (page: AutomationLibraryPageMap[T]) => Promise<unknown>,
    dateConstructor: typeof Date = Date
) {
    let browser: puppeteer.Browser | playwright.Browser;
    const userSettings = await loadSettings();

    if (options.automationLibrary === 'playwright') {
        // @ts-expect-error
        const playwrightBrowserOptions: PlaywrightBrowserOptions = options.browserOptions ? options.browserOptions : { browser: 'chromium' };

        // playwrightBrowserOptions.headless takes precedents over options.headless
        if ('headless' in options && !('headless' in playwrightBrowserOptions)) {
            playwrightBrowserOptions.headless = options.headless;
        }

        browser = await launchPlaywrightByOptions(playwrightBrowserOptions);
    } else {
        const puppeteerOpts = {
        } as any;

        if (options.browserOptions?.browserArgs) {
            puppeteerOpts.args = options.browserOptions?.browserArgs;
        }

        if ('headless' in options) {
            puppeteerOpts.headless = options.headless;
        }

        if (options.browserOptions && 'headless' in options.browserOptions) {
            puppeteerOpts.headless = options.browserOptions.headless;
        }

        // The user might not have puppeteer installed
        // we use require here and not the top import to no crash if the user don't have it installed
        browser = await require('puppeteer').launch(puppeteerOpts);
    }

    const realPage = await browser.newPage();

    const callSite = getSelfCallSiteFromStacktrace();
    const fullSuitePath = callSite?.getFileName() || 'no_suite_available';

    const startTestParams: StartTestParams = {
        runId: options._runId ? options._runId : FALLBACK_RUN_ID,
        fullName: `${dateConstructor.now()}-${options.testName}`,
        description: options.testName,
        projectRoot: process.cwd(),
        fullSuitePath,
    };

    const { page, endTest } = await attach({ page: realPage, startTestParams, activeFeatures: userSettings.features }, dateConstructor);

    try {
        // typescript discrimination limitation
        await userTestFunction(page as any);

        await endTest({
            success: true,
        });
    } catch (error) {
        await endTest({
            success: false,
            error,
        });

        throw error;
    } finally {
        await updateHistoryFromRootCauseResultsOnly(
            startTestParams.runId,
            startTestParams.projectRoot,
            dateConstructor
        );
        await browser.close();

        if (!options.noServer) {
            const url = await openServer(
                TEST_API_PORT,
                testResultDirFromStartParams(startTestParams)
            );
            // eslint-disable-next-line no-console
            console.log(chalk.blue(`Root Cause viewer: ${url}`));

            open(url);

            console.log('Press any key to exit');

            if (process.stdin.isTTY) {
                process.stdin.setRawMode(true);
            }
            process.stdin.resume();
            process.stdin.once('data', async () => {
                await persistIfNeeded(startTestParams);
                closeServer();
                process.exit(0);
            });

        } else {
            await persistIfNeeded(startTestParams);

        }
    }
}

async function persistIfNeeded(startTestParams: StartTestParams) {
    if (process.env.TESTIM_PERSIST_RESULTS_TO_CLOUD) {
        await persist(startTestParams.runId, {
            projectRoot: startTestParams.projectRoot,
            resultLabel: (global as any).resultLabels ?? null,
        });
    }
}

function launchPlaywrightByOptions(options: PlaywrightBrowserOptions) {
    // The user might not have puppeteer installed
    // we use require here and not the top import to no crash if the user don't have it installed
    const playwrightPlatform = require('playwright')[options.browser];

    return playwrightPlatform.launch({
        headless: options.headless,
        args: options.browserArgs,
    });
}
