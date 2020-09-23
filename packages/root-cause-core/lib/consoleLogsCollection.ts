import type { ConsoleMessage as PuppeteerConsoleMessage, JSHandle } from 'puppeteer';
import type { ConsoleMessage as PlaywrightConsoleMessage } from 'playwright';
import type { TestContext } from './TestContext';
import type { RootCausePage } from './interfaces';
import { isNotPlaywrightPage } from './utils';
import { addDisposer, runAllDisposers } from './hooksHandlersDisposersHelper';
import type { ConsoleException, ConsoleMessage } from '@testim/root-cause-types';

const DISPOSERS_TOPIC = 'console-logs';

/*
our CDP data sources are:
https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#event-consoleAPICalled
https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#event-exceptionThrown
https://chromedevtools.github.io/devtools-protocol/tot/Console/#event-messageAdded

Our puppeteer data sources are:
https://github.com/puppeteer/puppeteer/blob/v3.1.0/docs/api.md#event-console
https://github.com/puppeteer/puppeteer/blob/v3.1.0/docs/api.md#event-pageerror

puppeteer reports event-consoleAPICalled & event-messageAdded via the console event

Clickim have complex logs-from-cdp parsing logic at src/background/debuggerEvents/ChromeDebuggerParser.ts to our format
I don't see quick way to be compatible here, so for now i choose to go with interfaces similar to puppeteer.
*/

export async function logsBeforeAllHook(testContext: TestContext, proxyContext: any, rootPage: RootCausePage) {
  async function onConsole(message: PuppeteerConsoleMessage) {
    testContext.consoleEntries.push(
      await puppeteerOrPlaywrightConsoleMessageToOurRepresentation(message, testContext.dateConstructor.now())
    );
  }

  function onPageError(error: Error) {
    testContext.unhandledExceptions.push(
      puppeteerPageErrorToOurRepresentation(error, testContext.dateConstructor.now())
    );
  }

  async function onConsolePlaywright(message: PlaywrightConsoleMessage) {
    testContext.consoleEntries.push(
      await puppeteerOrPlaywrightConsoleMessageToOurRepresentation(message, testContext.dateConstructor.now())
    );
  }

  function onPageErrorPlaywright(error: Error) {
    testContext.unhandledExceptions.push(
      playwrightPageErrorToOurRepresentation(error, testContext.dateConstructor.now())
    );
  }

  // this if is here because typescript overloading types issues
  if (isNotPlaywrightPage(rootPage)) {
    rootPage.on('console', onConsole);
    rootPage.on('pageerror', onPageError);

    addDisposer(testContext, DISPOSERS_TOPIC, () => {
      rootPage.off('console', onConsole);
      rootPage.off('pageerror', onPageError);
    });
  } else {
    rootPage.on('console', onConsolePlaywright);
    rootPage.on('pageerror', onPageErrorPlaywright);

    addDisposer(testContext, DISPOSERS_TOPIC, () => {
      rootPage.off('console', onConsolePlaywright);
      rootPage.off('pageerror', onPageErrorPlaywright);
    });
  }
}

export async function logsAfterAllHook(testContext: TestContext) {
  runAllDisposers(testContext, DISPOSERS_TOPIC);
}

export async function logsBeforeEachHook(testContext: TestContext, proxyContext: any, rootPage: RootCausePage) {}

export async function logsAfterEachHook(testContext: TestContext, proxyContext: any, rootPage: RootCausePage) {
  const stepContext = testContext.currentStep;
  if (!stepContext) {
    return;
  }

  const consoleEntries = testContext.consoleEntries.filter((e) => e.timestamp > stepContext.startTimestamp);
  const unhandledExceptions = testContext.unhandledExceptions.filter((e) => e.timestamp > stepContext.startTimestamp);
  testContext.addStepMetadata({ consoleEntries, unhandledExceptions });
}

async function puppeteerOrPlaywrightConsoleMessageToOurRepresentation(
  message: PuppeteerConsoleMessage | PlaywrightConsoleMessage,
  timestamp: number
): Promise<ConsoleMessage> {
  // Extract element/hs handles to textual form that we can show
  // typescript the as is due to typescript limitation
  const args = await Promise.all(
    (message.args() as JSHandle[]).map((arg) =>
      arg.jsonValue().then(
        (value) => JSON.stringify(value),
        () => 'failed getting arg from page'
      )
    )
  );

  const location = message.location();
  // we don't have stack trace here
  // https://github.com/microsoft/playwright/blob/2a86ead0acc7baedd93aa79ad0811b16d04abfe9/src/page.ts#L296-L303
  // https://github.com/puppeteer/puppeteer/blob/v5.0.0/src/common/Page.ts#L521-L529
  return {
    level: message.type(),
    text: message.text(),
    line: location.lineNumber,
    column: location.columnNumber,
    url: location.url,
    timestamp,
    args,
  };
}

/**
 * from playwright, the error have stack property, from puppeteer, the stack is part of the message
 * https://github.com/puppeteer/puppeteer/blob/adeffbaac1ded2660931919f98fabf84c72724e4/src/common/Page.ts#L823-L829
 * https://github.com/microsoft/playwright/blob/b7df4d57a46482bc171cc2b362c542699477da93/src/chromium/crProtocolHelper.ts#L85
 */
function playwrightPageErrorToOurRepresentation(error: Error, timestamp: number): ConsoleException {
  return {
    message: error.message,
    timestamp,
    stack: error.stack,
  };
}

function puppeteerPageErrorToOurRepresentation(error: Error, timestamp: number): ConsoleException {
  const resolvedError = errorMessageStringToErrorWithStack(error.message);
  return {
    message: resolvedError.message,
    timestamp,
    stack: resolvedError.stack,
  };
}

// based on https://github.com/microsoft/playwright/blob/b7df4d57a46482bc171cc2b362c542699477da93/src/chromium/crProtocolHelper.ts#L69-L86
export function errorMessageStringToErrorWithStack(messageWithStack: string): Error {
  const lines = messageWithStack.split('\n');
  const firstStackTraceLine = lines.findIndex((line) => line.startsWith('    at'));
  let message = '';
  let stack = '';
  if (firstStackTraceLine === -1) {
    message = messageWithStack;
  } else {
    message = lines.slice(0, firstStackTraceLine).join('\n');
    stack = messageWithStack;
  }
  const match = message.match(/^[a-zA-Z0-0_]*Error: (.*)$/);
  if (match) {
    message = match[1];
  }
  const err = new Error(message);
  err.stack = stack;
  return err;
}
