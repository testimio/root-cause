import { exec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';
import { BeforeAllHook, BeforeAllHookArgs } from '../interfaces';
import { getSystemInfoForPage } from '../utils';

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
