import type { StepResult } from '@testim/root-cause-types';

export function extractStepName(result: StepResult) {
  const name = result.fnName ?? 'Run Command';
  const selector = result.selector;
  const text = result.text;
  if (selector && text) {
    return `${name} "${text}" on "${selector}"`;
  }
  if (selector) {
    return `${name} "${selector}"`;
  }
  if (text) {
    return `${name} "${text}"`;
  }
  return `${name}`;
}
