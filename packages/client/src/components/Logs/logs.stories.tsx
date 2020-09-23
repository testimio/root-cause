import React from 'react';
import { Logs } from './Logs';
import type { TestResultFile } from '@testim/root-cause-types';
import fixture from './fixtures/resultsFromTestWithManyKindsOfConsoleEntries.json';

const resultFile: TestResultFile = fixture as TestResultFile;

export default {
  title: 'Console Logs Tab',
  component: Logs,
};

export function StepWithManyKinds() {
  return <Logs step={resultFile.steps[8]} />;
}

export function EmptyState() {
  return <Logs step={resultFile.steps[0]} />;
}

export function StepWithOneError() {
  return <Logs step={resultFile.steps[1]} />;
}

export function WithWarning() {
  return <Logs step={resultFile.steps[2]} />;
}

export function RegularLog() {
  return <Logs step={resultFile.steps[3]} />;
}

export function StepWithAssertion() {
  return <Logs step={resultFile.steps[6]} />;
}
export function StepWithTable() {
  return <Logs step={resultFile.steps[7]} />;
}
