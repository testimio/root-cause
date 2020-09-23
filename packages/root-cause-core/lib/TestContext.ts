import { StepResultWithName } from './StepResultWithName';
import fs from 'fs-extra';
import { TEST_RESULTS_FILE_NAME } from './consts';
import path from 'path';

import debug from 'debug';
import type { StepResult, TestMetadata, ConsoleMessage, ConsoleException } from '@testim/root-cause-types';
import { ActiveFeatures } from './attachInterfaces';

const loggerError = debug('root-cause:error');

export class TestContext {
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

  get currentStep(): Readonly<StepResult> | undefined {
    return this._currentStep;
  }

  stepStarted(): void {
    this.stepIndex++;
    this._currentStep = new StepResultWithName(this.stepIndex, this.dateConstructor);
  }

  getStepIndex() {
    return this.stepIndex;
  }

  async stepEnded(): Promise<void> {
    if (this._currentStep) {
      this._currentStep.endTimestamp = this.dateConstructor.now();
      this.stepResults.push(this._currentStep);
      this._currentStep = undefined;
    }

    await this.persistResults();
  }

  async testEnded() {
    this.testMetadata.endedTimestamp = this.dateConstructor.now();
    await this.persistResults();
  }

  addTestMetadata(metadata: any) {
    Object.assign(this.testMetadata, metadata);
  }

  addStepMetadata(metadata: any) {
    Object.assign(this._currentStep, metadata);
  }

  addAssertionStep(partialStep: Omit<StepResult, 'index' | 'startTimestamp'>) {
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
      steps: this.stepResults,
    };
  }
}
