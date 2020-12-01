import type { StepError } from '@testim/root-cause-types';
import { exec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';
import type {
  AfterAllHook,
  AfterHook,
  AfterHookArgs,
  BeforeAllHook,
  BeforeAllHookArgs,
} from './interfaces';
import { extractCodeLocationDetailsSync, getSystemInfoForPage } from './utils';

export const errorInStepHook: AfterHook = async function errorInStepHook({
  instrumentedFunctionResult,
  stepResult,
}: AfterHookArgs) {
  if (!instrumentedFunctionResult.success) {
    stepResult.stepError = unknownErrorToOurRepresentation(instrumentedFunctionResult.error);
  }
};

async function getBranchInfo(): Promise<{ commitHash: string; branchName: string }> {
  function getEnvironmentGitBranch() {
    return (
      process.env.GIT_BRANCH ??
      process.env.CIRCLE_BRANCH ??
      process.env.TRAVIS_BRANCH ??
      process.env.CI_BRANCH
    );
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
export const testSystemInfoHook: BeforeAllHook = async function testSystemInfoHook({
  rootPage,
  testContext,
}: BeforeAllHookArgs) {
  const [systemInfo, branchInfo] = await Promise.all([
    getSystemInfoForPage(rootPage),
    getBranchInfo(),
  ]);
  testContext.addTestMetadata({
    systemInfo,
    branchInfo,
  });
};

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

export const testEndHook: AfterAllHook = async function testEndHook({ testContext, endStatus }) {
  if (endStatus.success) {
    testContext.addTestMetadata({
      testEndStatus: {
        success: true,
      },
    });
  } else {
    const error = unknownErrorToOurRepresentation(endStatus.error);
    let codeLocationDetails;

    try {
      codeLocationDetails = extractCodeLocationDetailsSync(testContext.testFilePath, process.cwd());
    } catch (e) {
      // will not work on node, and also is considered best effort here
    }

    testContext.addTestMetadata({
      testEndStatus: {
        success: endStatus.success,
        error,
        codeLocationDetails,
      },
    });
  }
};
