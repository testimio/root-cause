import type {
  StepResult,
  TestMetadata,
  ConsoleMessage,
  ConsoleException,
} from '@testim/root-cause-types';
import { ActiveFeatures } from './attachInterfaces';
import { TestContextInterface } from './TestContext';

export class TestContextMemory implements TestContextInterface {
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
    const step: StepResult = {
      index: this.stepIndex,
      startTimestamp: this.dateConstructor.now(),
    };

    return step;
  }

  async stepEnded(): Promise<void> {
    if (this._currentStep) {
      this._currentStep.endTimestamp = this.dateConstructor.now();
      this.stepResults.push(this._currentStep);
      this._currentStep = undefined;
    }
  }

  async testEnded(): Promise<void> {
    this.testMetadata.endedTimestamp = this.dateConstructor.now();
  }

  addTestMetadata(metadata: Record<string | number, unknown>): void {
    Object.assign(this.testMetadata, metadata);
  }

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
}
