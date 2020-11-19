import type { Page as PuppeteerPage, CDPSession } from 'puppeteer';
import type { Page as PlaywrightPage, CDPSession as PlaywrightCDPSession } from 'playwright';
import type { TestContextInterface } from './TestContext';
import type { BeforeAllHook, AfterAllHook } from './interfaces';
import { isNotPlaywrightPage, isPlaywrightChromiumBrowserContext } from './utils';
import chromeHar, { ChromeHarMessage } from '@testim/chrome-har';
import { addDisposer, runAllDisposers } from './hooksHandlersDisposersHelper';
import fs from 'fs-extra';
import path from 'path';

const messagesForPageMap = new WeakMap<TestContextInterface, Array<ChromeHarMessage>>();

const cdpEventsToListenOn = [
  'Network.loadingFailed',
  'Network.loadingFinished',
  'Network.requestServedFromCache',
  'Network.requestWillBeSent',
  'Network.resourceChangedPriority',
  'Network.responseReceived',
  'Page.domContentEventFired',
  'Page.frameAttached',
  'Page.frameNavigated',
  'Page.frameScheduledNavigation',
  'Page.frameStartedLoading',
  'Page.loadEventFired',
  'Page.navigatedWithinDocument',
  // 'Network.dataReceived', // very verbose, and not very informative. hide for now
] as const;

function getMessagesForTestContextMap(textContext: TestContextInterface) {
  let messages = messagesForPageMap.get(textContext);

  if (!messages) {
    messages = [];
    messagesForPageMap.set(textContext, messages);
  }

  return messages;
}

const DISPOSERS_TOPIC = 'network-logs';

export const networkLogsBeforeAllHook: BeforeAllHook = async function networkLogsBeforeAllHook({
  testContext,
  rootPage,
}) {
  if (isNotPlaywrightPage(rootPage)) {
    return networkLogsBeforeAllHookPuppeteer({
      testContext,
      page: rootPage,
    });
  }

  return networkLogsBeforeAllHookPlaywright({
    testContext,
    page: rootPage,
  });
};

async function networkLogsBeforeAllHookPuppeteer({
  testContext,
  page,
}: {
  testContext: TestContextInterface;
  page: PuppeteerPage;
}) {
  // We may create new CDP session, and activate the needed events
  // for now - we use private client of the page
  // const cdpSession = await page.target().createCDPSession();
  const cdpSession: CDPSession = (page as any)._client;

  for (const eventToListenOn of cdpEventsToListenOn) {
    // eslint-disable-next-line no-inner-declarations
    function listener(params: any) {
      getMessagesForTestContextMap(testContext).push({
        method: eventToListenOn,
        params,
      });
    }

    cdpSession.on(eventToListenOn, listener);
    addDisposer(testContext, DISPOSERS_TOPIC, () => {
      cdpSession.off(eventToListenOn, listener);
    });
  }
}

function networkLogsBeforeAllHookPlaywright({
  testContext,
  page,
}: {
  testContext: TestContextInterface;
  page: PlaywrightPage;
}) {
  const context = page.context();

  if (isPlaywrightChromiumBrowserContext(context)) {
    // TODO validate we see events from all of the frames,
    // and if not, listen on all frames (Including frames that were added on the fly)

    // @ts-ignore
    const cdpSession: PlaywrightCDPSession = page._delegate._mainFrameSession._client;

    for (const eventToListenOn of cdpEventsToListenOn) {
      // eslint-disable-next-line no-inner-declarations
      function listener(params: any) {
        getMessagesForTestContextMap(testContext).push({
          method: eventToListenOn,
          params,
        });
      }

      cdpSession.on(eventToListenOn, listener);
      addDisposer(testContext, DISPOSERS_TOPIC, () => {
        cdpSession.off(eventToListenOn, listener);
      });
    }
  }
}

export const networkLogsAfterAllHook: AfterAllHook = async function networkLogsAfterAllHook({
  testContext,
}) {
  const messages = getMessagesForTestContextMap(testContext);

  const harFileContents = chromeHar.harFromMessages(messages, {});
  await fs.writeFile(
    path.resolve(testContext.testArtifactsFolder, 'networkLogs.har'),
    JSON.stringify(harFileContents, null, 2)
  );

  testContext.addTestMetadata({ hasNetworkLogs: true });

  runAllDisposers(testContext, DISPOSERS_TOPIC);
};
