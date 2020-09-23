import type { Page as PuppeteerPage, CDPSession } from 'puppeteer';
import type { Page as PlaywrightPage, CDPSession as PlaywrightCDPSession } from 'playwright';
import type { TestContext } from './TestContext';
import type { RootCausePage } from './interfaces';
import { isNotPlaywrightPage, isPlaywrightChromiumBrowserContext } from './utils';
import chromeHar, { ChromeHarMessage } from 'chrome-har';
import { addDisposer, runAllDisposers } from './hooksHandlersDisposersHelper';
import fs from 'fs-extra';
import path from 'path';

const messagesForPageMap = new WeakMap<TestContext, Array<ChromeHarMessage>>();

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

function getMessagesForTestContextMap(textContext: TestContext) {
  let messages = messagesForPageMap.get(textContext);

  if (!messages) {
    messages = [];
    messagesForPageMap.set(textContext, messages);
  }

  return messages;
}

const DISPOSERS_TOPIC = 'network-logs';

export async function networkLogsBeforeAllHook(testContext: TestContext, proxyContext: any, rootPage: RootCausePage) {
  if (isNotPlaywrightPage(rootPage)) {
    return networkLogsBeforeAllHookPuppeteer(testContext, rootPage);
  }

  return networkLogsBeforeAllHookPlaywright(testContext, rootPage);
}

async function networkLogsBeforeAllHookPuppeteer(testContext: TestContext, page: PuppeteerPage) {
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

function networkLogsBeforeAllHookPlaywright(testContext: TestContext, page: PlaywrightPage) {
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

export async function networkLogsAfterAllHook(testContext: TestContext) {
  const messages = getMessagesForTestContextMap(testContext);

  const harFileContents = chromeHar.harFromMessages(messages, {});
  await fs.writeFile(
    path.resolve(testContext.testArtifactsFolder, 'networkLogs.har'),
    JSON.stringify(harFileContents, null, 2)
  );

  testContext.addTestMetadata({ hasNetworkLogs: true });

  runAllDisposers(testContext, DISPOSERS_TOPIC);
}
