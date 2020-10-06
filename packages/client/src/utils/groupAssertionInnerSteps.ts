import type { StepResult } from '@testim/root-cause-types';

export function groupAssertionInnerSteps(rawSteps: StepResult[], removeGrouped: boolean) {
  const indexesToRemove: number[] = [];

  const mappedSteps = rawSteps.map((step, index) => {
    if (step.fnName === 'assertion') {
      const belonging = getBelongingStepsIndexes(rawSteps, index);
      indexesToRemove.push(...belonging);

      if (belonging.length > 0 && rawSteps[belonging.length - 1].screenshot) {
        return {
          ...step,
          screenshot: rawSteps[belonging.length - 1].screenshot,
          rect: rawSteps[belonging.length - 1].rect,
        };
      }
    }

    return step;
  });

  return mappedSteps.filter((step, i) => !removeGrouped || !indexesToRemove.includes(i));
}

function getBelongingStepsIndexes(rawSteps: StepResult[], parentStepIndex: number) {
  const indexes: number[] = [];
  const parentStep = rawSteps[parentStepIndex];

  for (let i = parentStepIndex - 1; i >= 0; i -= 1) {
    const currentStep = rawSteps[i];

    if (compareCallstackStart(parentStep, currentStep)) {
      indexes.push(i);
    } else {
      break;
    }
  }

  return indexes;
}

function compareCallstackStart(
  { stepCodeLocation: stepCodeLocationA }: StepResult,
  { stepCodeLocation: stepCodeLocationB }: StepResult
) {
  return (
    stepCodeLocationA &&
    stepCodeLocationB &&
    stepCodeLocationA.sourceFileRelativePath === stepCodeLocationB.sourceFileRelativePath &&
    stepCodeLocationA.row === stepCodeLocationB.row &&
    stepCodeLocationA.column === stepCodeLocationB.column
  );
}
