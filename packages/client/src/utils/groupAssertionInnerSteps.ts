import type { StepResult } from '@testim/root-cause-types';

export function groupAssertionInnerSteps(rawSteps: StepResult[], removeGrouped: boolean) {
  const indexesToRemove: number[] = [];

  for (const [index, step] of rawSteps.entries()) {
    if (step.fnName === 'assertion') {
      const belonging = getBelongingStepsIndexes(rawSteps, index);
      indexesToRemove.push(...belonging);

      if (indexesToRemove.length > 0 && rawSteps[indexesToRemove.length - 1].screenshot) {
        // MUTATE ON PLACE :O
        step.screenshot = rawSteps[indexesToRemove.length - 1].screenshot;
        step.rect = rawSteps[indexesToRemove.length - 1].rect;
      }
    }
  }

  return rawSteps.filter((step, i) => !removeGrouped || !indexesToRemove.includes(i));
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
  if (!stepCodeLocationA || !stepCodeLocationB) {
    return false;
  }

  return (
    stepCodeLocationA.sourceFileRelativePath === stepCodeLocationB.sourceFileRelativePath &&
    stepCodeLocationA.row === stepCodeLocationB.row &&
    stepCodeLocationA.column === stepCodeLocationB.column
  );
}
