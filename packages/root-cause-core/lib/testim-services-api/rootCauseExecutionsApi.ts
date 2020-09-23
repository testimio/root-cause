import { runConclusionToTestimExecution, getRunConclusionFiles } from './runConclusionToTestimExecution';
import type { TestimUserMetadata, GitMetadata } from './runConclusionToTestimExecution';
import { TestimExecutionsApi } from './testimExecutionsApi';
import { TestimAssetsApi } from './testimAssetsApi';
import * as path from 'path';
import { createReadStream } from 'fs';
import { TestimBackendExecutionInputFormat } from './interfaces';
import * as fse from 'fs-extra';
import type { AbortSignal } from 'abort-controller';
import { RunConclusionFile, TestResultFile } from '@testim/root-cause-types';

type ProgressCallback = (progress: number) => void;

export class RootCauseExecutionsApi {
  constructor(
    private testimExecutionsApi: TestimExecutionsApi = new TestimExecutionsApi(),
    private testimAssetsApi: TestimAssetsApi = new TestimAssetsApi()
  ) {}
  async createExecution(
    conclusionFolderPath: string,
    testimUserMetadata: TestimUserMetadata,
    progress?: ProgressCallback,
    signal?: AbortSignal
  ) {
    // eslint-disable-next-line import/no-dynamic-require
    const conclusion = require(path.join(conclusionFolderPath, 'runConclusion.json')) as RunConclusionFile;
    //TODO(benji)
    // zip - maybe zip multiple photos

    const filesToUpload = await getRunConclusionFiles(conclusionFolderPath);
    const arbitraryResultsFilePath = filesToUpload.find((file) => file.endsWith('results.json'));
    const gitMetadata = arbitraryResultsFilePath ? extractGitMetadata(arbitraryResultsFilePath) : undefined;
    const execution = runConclusionToTestimExecution(conclusion, testimUserMetadata, gitMetadata);
    execution.metadata.screenplayFilesUploaded = filesToUpload.length;

    await createTempResultFilesWithResultIds(filesToUpload, execution);

    function isImage(fileName: string) {
      return fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.webp');
    }
    execution.metadata.screenplayImagesUploaded = filesToUpload.filter(isImage).length;

    await this.testimExecutionsApi.createExecution(execution, signal);

    let done = 0;
    const filePromises = filesToUpload.map((file) =>
      this.testimAssetsApi
        .uploadAsset({
          // @todo sync server and client
          pathInsideBucket: `.root-cause/${conclusion.runId}/${path.relative(conclusionFolderPath, file)}`,
          projectId: testimUserMetadata.projectId,
          asset: createReadStream(file.endsWith('results.json') ? `${file.substr(0, file.length - 5)}_tmp.json` : file),
          signal,
        })
        .then(() => {
          done += 1;
          if (progress) {
            progress(done / filesToUpload.length);
          }
        })
    );
    await Promise.all(filePromises);
    await removeTempResultFiles(filesToUpload);
    return { rootCauseConclusion: conclusion, testimFormat: execution };
  }
}

async function createTempResultFilesWithResultIds(files: string[], execution: TestimBackendExecutionInputFormat) {
  const executionResults = Object.keys(execution.execution).map((resultId) => execution.execution[resultId]);

  for (let i = 0; i < files.length; i++) {
    if (files[i].endsWith('results.json')) {
      // eslint-disable-next-line no-await-in-loop
      const resultFile = await fse.readJSON(files[i]);
      resultFile.resultId = executionResults.find((er) => er.endTime === resultFile.metadata.endedTimestamp)?.resultId;
      const tempPath = `${files[i].substr(0, files[i].length - 5)}_tmp.json`;
      // eslint-disable-next-line no-await-in-loop
      await fse.writeJSON(tempPath, resultFile);
    }
  }
}

async function removeTempResultFiles(files: string[]) {
  for (let i = 0; i < files.length; i++) {
    if (files[i].endsWith('results.json')) {
      const tempPath = `${files[i].substr(0, files[i].length - 5)}_tmp.json`;
      // eslint-disable-next-line no-await-in-loop
      await fse.unlink(tempPath);
    }
  }
}

function extractGitMetadata(fileName: string): GitMetadata | undefined {
  try {
    const testResult = require(fileName) as TestResultFile;
    const metadata = testResult.metadata.branchInfo;
    if (!metadata) {
      return undefined;
    }
    return {
      gitBranch: metadata.branchName,
      gitCommit: metadata.commitHash,
      gitRepoUrl: process.env.GIT_URL ?? process.env.CIRCLE_REPOSITORY_URL ?? '',
    };
  } catch (e) {
    return undefined;
  }
}
