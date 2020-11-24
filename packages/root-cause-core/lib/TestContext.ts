import fs from 'fs-extra';
import { TEST_RESULTS_FILE_NAME } from './consts';
import path from 'path';

import debug from 'debug';
import type {
  StepResult,
  TestMetadata,
  ConsoleMessage,
  ConsoleException,
} from '@testim/root-cause-types';
import { ActiveFeatures } from './attachInterfaces';
import { extractStepName } from './utils/step-name-extractor';

const loggerError = debug('root-cause:error');

export interface TestContextInterface {
  consoleEntries: ConsoleMessage[];
  unhandledExceptions: ConsoleException[];
  testArtifactsFolder: string;
  testFilePath: string;
  featuresSettings: ActiveFeatures;
  dateConstructor: typeof Date;
  stepStarted(): StepResult;
  stepEnded(stepResult: StepResult): Promise<void>;
  testEnded(): Promise<void>;
  addTestMetadata(metadata: any): void;
  addAssertionStep(partialStep: Omit<StepResult, 'index' | 'startTimestamp'>): void;
}

export class TestContext implements TestContextInterface {
  private stepIndex = 0;
  private stepResults: StepResult[] = [];
  private testMetadata: TestMetadata = {
    fileName: this.testFilePath,
    testName: this.testName,
    testFullName: this.testFullName,
    timestamp: 0,
    endedTimestamp: 0,
  };
  private _currentStep?: StepResult = undefined;

  public consoleEntries: ConsoleMessage[] = [];
  public unhandledExceptions: ConsoleException[] = [];

  constructor(
    public testArtifactsFolder: string,
    private testName: string,
    private testFullName: string,
    /**
     * full path to the test/suite file,
     * not relative to working directory
     */
    public testFilePath: string,
    public featuresSettings: ActiveFeatures,
    public dateConstructor: typeof Date = Date
  ) {
    this.testMetadata.timestamp = dateConstructor.now();
  }

  stepStarted(): StepResult {
    this.stepIndex++;
    const startedStep: StepResult = {
      index: this.stepIndex,
      startTimestamp: this.dateConstructor.now(),
    };
    return startedStep;
  }

  getStepIndex(): number {
    return this.stepIndex;
  }

  async stepEnded(stepResult: StepResult): Promise<void> {
    stepResult.endTimestamp = this.dateConstructor.now();
    this.stepResults.push(stepResult);
    // Due to the concurrent steps support, stepIndex and the position in the stepResults array might not be synced,
    // (Later step might end before earlier one)
    // So we want to ensure it is
    this.stepResults.sort((stepA, stepB) => {
      return stepA.index - stepB.index;
    });

    await this.persistResults();
  }

  async testEnded(): Promise<void> {
    this.testMetadata.endedTimestamp = this.dateConstructor.now();
    await this.persistResults();
  }

  addTestMetadata(metadata: Record<string | number, any>): void {
    Object.assign(this.testMetadata, metadata);
  }

  // addStepMetadata(metadata: Record<string | number, any>): void {
  //   Object.assign(this._currentStep, metadata);
  // }

  addAssertionStep(partialStep: Omit<StepResult, 'index' | 'startTimestamp'>): void {
    if (this._currentStep) {
      throw new Error("invariant: Can't add assertion in a middle of step");
    }

    this.stepIndex++;
    const stepWithIndex = {
      index: this.stepIndex,
      startTimestamp: this.dateConstructor.now(),
      ...partialStep,
    };
    this.stepResults.push(stepWithIndex);
  }

  private async persistResults() {
    try {
      await fs.writeFile(
        path.resolve(this.testArtifactsFolder, TEST_RESULTS_FILE_NAME),
        JSON.stringify(this.getResultsForPersistency(), null, 2)
      );
    } catch (error) {
      loggerError('persistResults error');
      loggerError(error);
    }
  }

  private getResultsForPersistency() {
    return {
      metadata: this.testMetadata,
      steps: this.stepResults.map((result) => {
        return {
          ...result,
          name: result.name ? result.name : extractStepName(result),
        };
      }),
    };
  }
}
