import { TestResultFile } from '@testim/root-cause-types';

export interface RootCauseRunResultEntry {
  singleResultDir: string;
  id: string;
  testData: TestResultFile;
}
