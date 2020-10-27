import type { StepResult } from '@testim/root-cause-types';

export function groupAssertionInnerSteps(rawSteps: StepResult[], removeGrouped: boolean) {
  const indexesToRemove: number[] = [];

  const mappedSteps = rawSteps.map((step, index) => {
    if (step.fnName === 'assertion') {
      const belonging = getBelongingStepsIndexes(rawSteps, index);
      indexesToRemove.push(...belonging);

      const belongingSteps = rawSteps.filter((s, i) => belonging.includes(i));
      const belongingStepWithScreenshot = belongingSteps.filter((s) => s.screenshot);
      const belongingStepWithRect = belongingStepWithScreenshot.filter((s) => s.rect);
      const injectFromStep =
        belongingStepWithRect[belongingStepWithRect.length - 1] ||
        belongingStepWithScreenshot[belongingStepWithScreenshot.length - 1];

      if (belonging.length > 0) {
        return {
          ...step,
          screenshot: injectFromStep?.screenshot,
          rect: injectFromStep?.rect,
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
