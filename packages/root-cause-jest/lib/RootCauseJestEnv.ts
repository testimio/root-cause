/**
 * This jest environment tries to infer and load the originally intended jest environment,
 * Most probably jest-environment-puppeteer or jest-playwright-preset
 *
 * That's how we can add Root Cause stuff in jest env, but also let the user use his intended env with minimal configurations
 */

import type { EnvironmentContext, JestEnvironment } from '@jest/environment';
import type { LegacyFakeTimers, ModernFakeTimers } from '@jest/fake-timers';
import type { Circus, Config, Global } from '@jest/types';
import type { ModuleMocker } from 'jest-mock';
import { Script } from 'vm';
import { CurrentTestInfo } from './interfaces';

export default class RootCauseJestEnv implements JestEnvironment {
  private jestContext: EnvironmentContext | undefined;
  private actualEnv: JestEnvironment;
  private jestConfig: Config.ProjectConfig;

  constructor(config: Config.ProjectConfig, context?: EnvironmentContext) {
    this.jestContext = context;
    this.jestConfig = config;

    // eslint-disable-next-line import/no-dynamic-require
    let ActualEnv: typeof JestEnvironment = require(inferActualJestEnvironmentModule(config));
    // @ts-expect-error
    if (ActualEnv.default) {
      // @ts-expect-error
      ActualEnv = ActualEnv.default;
    }
    this.actualEnv = new ActualEnv(config, context);

    // Not sure how to detect circus in a different way (or runner that based on circus)
    if (config.testRunner.includes('jest-circus')) {
      this.global.rootCauseCircusEnvActive = true;
    }

    // Inject Root Cause after env code so the user won't need to configure it himself/
    // Hacky but works
    this.jestConfig.setupFilesAfterEnv.push(
      require.resolve('@testim/root-cause-jest/lib/forSetupFilesAfterEnv')
    );
  }

  get global(): Global.Global {
    return this.actualEnv.global;
  }

  get fakeTimers(): LegacyFakeTimers<unknown> | null {
    return this.actualEnv.fakeTimers;
  }

  get fakeTimersModern(): ModernFakeTimers | null {
    return this.actualEnv.fakeTimersModern;
  }

  get moduleMocker(): ModuleMocker | null {
    return this.actualEnv.moduleMocker;
  }

  runScript<T = unknown>(script: Script): T | null {
    return this.actualEnv.runScript(script);
  }

  get getVmContext() {
    return this.actualEnv.getVmContext?.bind(this.actualEnv);
  }

  async setup(): Promise<void> {
    await this.actualEnv.setup();
  }

  async teardown(): Promise<void> {
    await this.actualEnv.teardown();
  }

  /**
   * Circus only, but it won't break when running on jasmine
   * @param event
   * @param state
   */
  async handleTestEvent(event: Circus.Event, state: Circus.State) {
    if (this.jestContext && this.jestContext.testPath) {
      if (event.name === 'test_start') {
        const rootCauseCurrentTestInfo: CurrentTestInfo = {
          testPath: this.jestContext.testPath,
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

    if (this.actualEnv.handleTestEvent) {
      this.actualEnv.handleTestEvent(event, state);
    }
  }
}

function inferActualJestEnvironmentModule(jestConfig: Config.ProjectConfig): string {
  // user provides explicit env to load
  if (jestConfig.testEnvironmentOptions && jestConfig.testEnvironmentOptions.actualEnvironment) {
    return jestConfig.testEnvironmentOptions.actualEnvironment as string;
  }

  // Detect jest-playwright
  // https://github.com/playwright-community/jest-playwright/blob/9a297968222ccabdcbb7fa8c453082d733e0acd8/jest-preset.json#L5
  if (jestConfig.runner.endsWith('jest-playwright-preset/runner.js')) {
    return 'jest-playwright-preset/lib/PlaywrightEnvironment';
  }

  // Worth noting for jest-playwright-jsdom we don't have auto detect atm
  // https://github.com/playwright-community/jest-playwright-jsdom/blob/master/jest-preset.json

  // Detect jest-puppeteer
  // https://github.com/smooth-code/jest-puppeteer/blob/master/packages/jest-puppeteer-preset/jest-preset.json#L2
  if (
    jestConfig.globalSetup?.endsWith('jest-environment-puppeteer/setup.js') ||
    jestConfig.globalSetup?.endsWith('jest-environment-puppeteer/setup')
  ) {
    return 'jest-environment-puppeteer';
  }

  // Jest's default
  return 'jest-environment-jsdom';
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
