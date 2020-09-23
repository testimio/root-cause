import { extractStepName } from './utils/step-name-extractor';
import { StepResult } from '@testim/root-cause-types';

export class StepResultWithName implements StepResult {
  index = 0;
  startTimestamp: number = this.dateConstructor.now();

  constructor(stepIndex: number, private dateConstructor: typeof Date = Date) {
    this.index = stepIndex;
  }

  get name(): string {
    return extractStepName(this);
  }

  toJSON() {
    const obj: any = { ...this };
    delete obj.dateConstructor;
    obj.name = this.name;
    return obj;
  }
}
