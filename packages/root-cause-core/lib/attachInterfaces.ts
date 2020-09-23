import type { DOMRect, InstrumentedFunctionResult, CodeLocationDetails, StepError } from '@testim/root-cause-types';
import type { RootCausePage } from './interfaces';
import { ResolvedSettings } from './userSettings/interfaces';

export interface StartTestParams {
  /**
   * The nested describes, concatenated
   * That what we get from jasmine, i wish it was array
   */
  fullName: string;

  /**
   * The file name that contains the test
   *
   */
  fullSuitePath: string;

  /**
   * The string that in test(**HERE**, () => ....)
   */
  description: string;

  /**
   * Needs to be absolute path, to avoid possible issues
   * you probably want to use the cwd of test runner
   *
   */
  projectRoot: string;

  /**
   * run id
   */
  runId: string;
}

export interface AttachParams<TPage extends RootCausePage> {
  startTestParams?: StartTestParams;
  activeFeatures?: ActiveFeatures;
  page: TPage;
}

export type ActiveFeatures = ResolvedSettings['features'];

export interface AttachReturn<TPage extends RootCausePage> {
  page: TPage;
  endTest: EndTestFunction;
  persist: (resultLabels: string[]) => Promise<void>;
  /**
   * Pausing steps recording,
   * until resume is called
   */
  pauseStepsRecording(): void;

  /**
   * Resume paused recording
   */
  resumeStepsRecording(): void;

  reportAssertion: ReportAssertion;
}

export type TestEndStatus<T, E> = InstrumentedFunctionResult<T, E>;

export type EndTestFunction = (endStatus: TestEndStatus<unknown, unknown>) => Promise<void>;

export interface AssertionReport {
  name?: string;
  screenshot?: string;
  selector?: string;
  fnName?: string;
  text?: string;
  stepError?: StepError;
  stepCodeLocation?: CodeLocationDetails;
  rect?: DOMRect & { screenWidth: number; screenHeight: number; devicePixelRatio: number };
}

export type ReportAssertion = (assertion: AssertionReport) => void;
