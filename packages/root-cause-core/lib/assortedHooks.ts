import { TestContext } from './TestContext';
import type { RootCausePage } from './interfaces';
import type { InstrumentedFunctionResult, StepError } from '@testim/root-cause-types';
import { getSystemInfoForPage, captureStacktraceDetails, extractCodeLocationDetailsSync } from './utils';
import { TestEndStatus } from './attachInterfaces';
import { platform } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

export async function errorInStepHook(
  testContext: TestContext,
  fnName: string,
  proxyContext: any,
  rootPage: RootCausePage,
  args: any[],
  instrumentedFunctionResult: InstrumentedFunctionResult<any, any>
) {
  if (!instrumentedFunctionResult.success) {
    testContext.addStepMetadata({
      stepError: unknownErrorToOurRepresentation(instrumentedFunctionResult.error),
    });
  }
}

async function getBranchInfo(): Promise<{ commitHash: string; branchName: string }> {
  function getEnvironmentGitBranch() {
    return process.env.GIT_BRANCH ?? process.env.CIRCLE_BRANCH ?? process.env.TRAVIS_BRANCH ?? process.env.CI_BRANCH;
  }
  async function getCodeGitBranch() {
    // https://github.com/JPeer264/node-current-git-branch/blob/master/index.js
    let command;
    if (platform() === 'win32') {
      command = `pushd ${process.cwd()} & git branch | findstr \\*`;
    } else {
      command = `(cd ${process.cwd()} ; git branch | grep \\*)`;
    }
    try {
      const result = await promisify(exec)(command);

      return result.stdout.slice(2, result.stdout.length);
    } catch (e) {
      return '';
    }
  }
  function getEnvironmentGitCommit() {
    return process.env.GIT_COMMIT ?? process.env.CIRCLE_SHA1 ?? process.env.TRAVIS_COMMIT;
  }
  async function getGitCommitExec() {
    try {
      return (await promisify(exec)('git rev-parse HEAD')).stdout;
    } catch (e) {
      return '';
    }
  }

  const branchName = (getEnvironmentGitBranch() ?? (await getCodeGitBranch()))?.trim();
  const commitHash = (getEnvironmentGitCommit() ?? (await getGitCommitExec()))?.trim();
  return { branchName, commitHash };
}
export async function testSystemInfoHook(testContext: TestContext, proxyContext: any, rootPage: RootCausePage) {
  const [systemInfo, branchInfo] = await Promise.all([getSystemInfoForPage(rootPage), getBranchInfo()]);
  testContext.addTestMetadata({
    systemInfo,
    branchInfo,
  });
}

function unknownErrorToOurRepresentation(error: unknown): StepError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  // sometimes errors we get are cross-realm
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const crossRealmError = error as Error;
    return {
      name: crossRealmError?.name ?? '',
      message: crossRealmError?.message ?? '',
      stack: crossRealmError?.stack ?? '',
    };
  }

  // It's unlikely but we might meet here obscure thrown values
  // strings, numbers, objects
  // we may add more logic here to get something out of them
  return {
    name: 'non serializable error?',
    message: 'non serializabsle error',
  };
}

export async function testEndHook(testContext: TestContext, testEndStatus: TestEndStatus<unknown, unknown>) {
  if (testEndStatus.success) {
    testContext.addTestMetadata({
      testEndStatus: {
        success: true,
      },
    });
  } else {
    const error = unknownErrorToOurRepresentation(testEndStatus.error);
    let codeLocationDetails;

    try {
      codeLocationDetails = extractCodeLocationDetailsSync(testContext.testFilePath, process.cwd());
    } catch (e) {
      // extractCodeLocationDetailsSync is best effort here, ignore that
    }

    testContext.addTestMetadata({
      testEndStatus: {
        success: testEndStatus.success,
        error,
        codeLocationDetails,
      },
    });
  }
}
