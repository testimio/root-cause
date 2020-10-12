import type { Circus, Config } from '@jest/types';
import type { JestEnvironment, EnvironmentContext } from '@jest/environment';
import { CurrentTestInfo, FailedExpectationsSubset } from './interfaces';
import { TestEndStatus } from '@testim/root-cause-types';

export function getEndStatusFromCircus(): TestEndStatus<unknown, FailedExpectationsSubset> {
  const t = getCurrentTestInfoFromCircus();
  const testEndStatus =
    t.failedExpectations.length > 0
      ? ({
          success: false,
          error: t.failedExpectations[0],
        } as const)
      : ({
          success: true,
        } as const);

  return testEndStatus;
}

export function isRootCauseCircusEnvActive() {
  // @ts-expect-error
  return !!global.rootCauseCircusEnvActive;
}

export function getCurrentTestInfoFromCircus(): CurrentTestInfo {
  if (!('rootCauseCurrentTestInfo' in global)) {
    throw new Error('Root Cause integration error: rootCauseCurrentTestInfo is not available');
  }

  // @ts-expect-error
  return global.rootCauseCurrentTestInfo;
}

export function wrapCircusEnvClass(klassToWrap: typeof JestEnvironment): typeof JestEnvironment {
  class RootCauseEnvWrapper extends klassToWrap {
    /**
     * We can't use the name context because there's already this.context
     */
    private jestEnvContext: EnvironmentContext | undefined;
    constructor(config: Config.ProjectConfig, context?: EnvironmentContext) {
      super(config, context);
      this.jestEnvContext = context;
      this.global.rootCauseCircusEnvActive = true;
    }

    async handleTestEvent(event: Circus.Event, state: Circus.State) {
      if (this.jestEnvContext && this.jestEnvContext.testPath) {
        if (event.name === 'test_start') {
          const rootCauseCurrentTestInfo: CurrentTestInfo = {
            testPath: this.jestEnvContext.testPath,
            description: event.test.name,
            fullName: circusJestEntryToFullTestName(event.test),
            failedExpectations: [],
          };

          this.global.rootCauseCurrentTestInfo = rootCauseCurrentTestInfo;
          // consider using test_done
        } else if (event.name === 'test_fn_failure') {
          if (this.global.rootCauseCurrentTestInfo) {
            // @ts-expect-error
            this.global.rootCauseCurrentTestInfo.failedExpectations.push(event.error);
          }
        }
      }

      if (super.handleTestEvent) {
        super.handleTestEvent(event, state);
      }
    }
  }

  return RootCauseEnvWrapper;
}

function circusJestEntryToFullTestName(testEntry: Circus.TestEntry): string {
  const parts = [testEntry.name];
  let parent: Circus.DescribeBlock | undefined = testEntry.parent;

  while (parent !== undefined) {
    if (parent.name !== 'ROOT_DESCRIBE_BLOCK') {
      parts.push(parent.name);
    }
    parent = parent.parent;
  }

  return parts.reverse().join(' ');
}
