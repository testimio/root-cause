import { promises as fs } from 'fs';
import { join } from 'path';
import { AfterAllHook, BeforeAllHook, RootCausePage } from '../interfaces';
import { getChromeCDPSession, sendCDPMessage } from '../utils';
import { NOOP_HOOK } from './hookUtils';

export interface ProfilingHooks {
  startProfilingHook: BeforeAllHook;
  stopProfilingHook: AfterAllHook;
}

export async function createProfilingHooks(page: RootCausePage): Promise<ProfilingHooks> {
  const session = await getChromeCDPSession(page);

  if (!session) {
    return {
      startProfilingHook: NOOP_HOOK,
      stopProfilingHook: NOOP_HOOK,
    };
  }

  // example taken from https://github.com/paulirish/automated-chrome-profiling/blob/master/get-cpu-profile.js
  return {
    async startProfilingHook() {
      await sendCDPMessage(session, 'Profiler.enable');
      await sendCDPMessage(session, 'Profiler.setSamplingInterval', {
        interval: 100,
      });
      await sendCDPMessage(session, 'Profiler.start');
    },
    async stopProfilingHook({ testContext }) {
      const { profile } = await sendCDPMessage(session, 'Profiler.stop');

      const profilingFile = `profile.cpuprofile`;
      const outputFilePath = join(testContext.testArtifactsFolder, profilingFile);
      await fs.writeFile(outputFilePath, JSON.stringify(profile, null, 2));
      testContext.addTestMetadata({ profilingFile });
    },
  };
}
