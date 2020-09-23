// generated with json2ts

interface TestimExecutionExecutionRunConfig {
  parallel: number;
  browser: string;
  runnerVersion: string;
  testimBranch: string;
  canaryMode: boolean;
  source: string;
  testPlans: any[];
  testLabels: any[];
  testNames: any[];
  testIds: any[];
  testConfigs: any[];
  testConfigIds: any[];
  browserTimeout: number;
  timeout: number;
  newBrowserWaitTimeout: number;
  tunnelPort: string;
  runnerMode: string;
  sessionType: string;
  companyId: string;
  testData?: any;
  testDataTotal?: any;
  testDataIndex?: any;
  testConfig: {}; // not too interesting
}

interface TestExecution {
  testId: string;
  status: string;
  name: string;
  resultId: string;
  isTestsContainer: boolean;
  testRunOverrideStatus: string;
  config: TestimExecutionExecutionRunConfig;
  success?: boolean;
  reason?: string;
  childTestResultIds?: string[];
  startTime: number;
  endTime: number;
  parentResultId?: string;
  show?: boolean;
}

export interface TestimBackendExecutionFormatSubsetForReporting {
  runId: string;
  execution: {
    [id: string]: {
      testId: string;
      name: string;
      success?: boolean;
      resultId: string;
      parentResultId?: string;
      isTestsContainer: boolean;
    };
  };
  startTime: number;
}
export interface TestimBackendExecutionInputFormat {
  runId: string;
  projectId: string;
  labels: string;
  startTime: number;
  endTime: number;
  execution: { [id: string]: TestExecution };
  status: string;
  config: TestimExecutionExecutionRunConfig;
  resultLabels: string[];
  remoteRunId: string;
  metadata: any;
  show: boolean;
}
