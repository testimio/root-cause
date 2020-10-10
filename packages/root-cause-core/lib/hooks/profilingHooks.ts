import { promises as fs } from 'fs';
import { join } from 'path';
import {
  AfterAllHook,
  BeforeAllHook,
  IAutomationFrameworkInstrumentor,
  RootCausePage,
} from '../interfaces';
import { getChromeCDPSession, isPlaywrightPage, sendCDPMessage } from '../utils';

export async function instrumentProfilingHooks(
  instrumentor: IAutomationFrameworkInstrumentor,
  page: RootCausePage
) {
  await instrumentCDPBasedHooks(instrumentor, page);
  await instrumentPerformanceTrace(instrumentor, page);
}

async function instrumentPerformanceTrace(
  instrumentor: IAutomationFrameworkInstrumentor,
  page: RootCausePage
) {
  if (isPlaywrightPage(page)) {
    return;
  }

  const traceOutputFileName = 'performanceTrace.json';

  const setup: BeforeAllHook = async function startPerformanceTraceHook({ testContext }) {
    const outputPath = join(testContext.testArtifactsFolder, traceOutputFileName);
    await page.tracing.start({
      path: outputPath,
    });

    // TODO: it's kinda annoying that you have to create a separate hook for teardown.
    // I'd expect to be able to do something like returning TeardownLogic like in RxJS.
  };

  const teardown: AfterAllHook = async function stopPerformanceTraceHook({ testContext }) {
    await page.tracing.stop();
    testContext.addTestMetadata({ traceOutputFileName });
  };

  instrumentor.registerBeforeAllHook(setup);
  instrumentor.registerAfterAllHook(teardown);
}

// example taken from https://github.com/paulirish/automated-chrome-profiling/blob/master/get-cpu-profile.js
async function instrumentCDPBasedHooks(
  instrumentor: IAutomationFrameworkInstrumentor,
  page: RootCausePage
) {
  const session = await getChromeCDPSession(page);

  if (!session) {
    return;
  }

  const setup: BeforeAllHook = async function startCpuProfilingHook() {
    await sendCDPMessage(session, 'Profiler.enable');
    await sendCDPMessage(session, 'Profiler.setSamplingInterval', {
      interval: 100,
    });
    await sendCDPMessage(session, 'Profiler.start');
  };

  const teardown: AfterAllHook = async function stopCpuProfilingHook({ testContext }) {
    const { profile } = await sendCDPMessage(session, 'Profiler.stop');

    const profilingFile = `profile.cpuprofile`;
    const outputFilePath = join(testContext.testArtifactsFolder, profilingFile);
    await fs.writeFile(outputFilePath, JSON.stringify(profile, null, 2));
    testContext.addTestMetadata({ profilingFile });
  };

  instrumentor.registerBeforeAllHook(setup);
  instrumentor.registerAfterAllHook(teardown);
}
