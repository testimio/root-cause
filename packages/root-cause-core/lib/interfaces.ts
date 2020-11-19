import type { Page as PuppeteerPage } from 'puppeteer';
import type { Page as PlaywrightPage } from 'playwright';
import type { TestContextInterface } from './TestContext';
import type { TestEndStatus } from './attachInterfaces';
import type { InstrumentedFunctionResult } from '@testim/root-cause-types';

export type RootCausePage = PuppeteerPage | PlaywrightPage;

export interface AttachOptions {
  noResultsServer?: boolean;
  externalTestName?: string;
  resultsDirectory?: string;
}

export interface CommonEachHookArgs {
  testContext: TestContextInterface;
  fnName: string;
  proxyContext: any;
  rootPage: RootCausePage;
  args: any[];
  methodCallData: ProxiedMethodCallData[];
}

export type BeforeHookArgs = CommonEachHookArgs;

export type BeforeHook = (args: BeforeHookArgs) => Promise<void>;

export interface AfterHookArgs extends CommonEachHookArgs {
  instrumentedFunctionResult: InstrumentedFunctionResult<any, any>;
}

export type AfterHook = (args: AfterHookArgs) => Promise<void>;

export interface BeforeAllHookArgs {
  testContext: TestContextInterface;
  proxyContext: any;
  rootPage: RootCausePage;
}

export type BeforeAllHook = (args: BeforeAllHookArgs) => Promise<void>;

export interface AfterAllHookArgs {
  testContext: TestContextInterface;
  endStatus: TestEndStatus<unknown, unknown>;
}

export type AfterAllHook = (args: AfterAllHookArgs) => Promise<void>;

export interface IAutomationFrameworkInstrumentor {
  // register additional hooks on a context, this is implemented for
  // puppeteer/selenium
  // registerHooks(page: T, hooks: AutomationFrameworkHooks<T>): T;
  registerBeforeAllHook(hook: BeforeAllHook): void;
  registerAfterAllHook(hook: AfterAllHook): void;
  registerBeforeHook(hook: BeforeHook): void;
  registerAfterHook(hook: AfterHook): void;
  wrapWithProxy<T extends object>(proxiedObject: T): T;
  end(endStatus: TestEndStatus<unknown, unknown>): Promise<void>;
  pause(): void;
  resume(): void;
}

export interface ProxiedMethodCallData {
  creationFunction: string;
  selector?: string;
  text?: string;
  index?: number;
}
