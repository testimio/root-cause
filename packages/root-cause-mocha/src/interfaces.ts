import type { StartTestParams } from '@testim/root-cause-core';

export interface RootCauseTestAddonData {
  startTestParams: StartTestParams;
  testIntermediateResultDir: string;
  runIntermediateResultsDir: string;
}
