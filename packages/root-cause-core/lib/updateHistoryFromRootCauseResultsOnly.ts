import {
  readRunResultsDirToMap,
  writeRunConclusion,
  readRunsHistory,
  updateRunsHistory,
  writeRunsHistory,
} from './runConclusion/runConclusionUtils';
import { constructResultDir, constructTestInvocationResultDir } from './utils';
import { FALLBACK_RUN_ID, HISTORY_RUNS_TO_RETAIN } from './consts';
import fs from 'fs-extra';
import type { RootCauseRunResultEntry } from './runConclusion/interfaces';
import type { RunConclusionFile } from '@testim/root-cause-types';

/**
 * To be used explicitly when there's no test runner
 */
export async function updateHistoryFromRootCauseResultsOnly(
  runId = FALLBACK_RUN_ID,
  projectRoot = process.cwd(),
  dateConstructor = Date
) {
  const resultsDirPath = constructResultDir(projectRoot);
  const runResultsPath = constructTestInvocationResultDir(projectRoot, runId);

  if (!(await fs.pathExists(resultsDirPath))) {
    throw new Error('None existing Root Cause path, make sure you use the same projectRoot as your attach call');
  }

  if (!(await fs.pathExists(runResultsPath))) {
    throw new Error(
      'None existing Root Cause runs path, make sure you use the same runId & projectRoot as your attach call'
    );
  }

  const rootCauseResults = await readRunResultsDirToMap(runResultsPath);
  const conclusion = prepareRunConclusionFromOnlyRootCauseResults(runId, dateConstructor.now(), rootCauseResults);
  await writeRunConclusion(resultsDirPath, runId, conclusion);
  const history = await readRunsHistory(resultsDirPath);
  // We may here also actually delete old files
  updateRunsHistory(history, conclusion, HISTORY_RUNS_TO_RETAIN);
  await writeRunsHistory(resultsDirPath, history);
}

export async function readHistoryFallback(
  runId = FALLBACK_RUN_ID,
  projectRoot = process.cwd(),
  dateConstructor = Date
): Promise<RunConclusionFile> {
  const rootCausePath = constructResultDir(projectRoot);
  const rootCauseRunResultsPath = constructTestInvocationResultDir(projectRoot, runId);

  if (!(await fs.pathExists(rootCausePath))) {
    throw new Error('None existing Root Cause path, make sure you use the same projectRoot as your attach call');
  }

  if (!(await fs.pathExists(rootCauseRunResultsPath))) {
    throw new Error(
      'None existing Root Cause runs path, make sure you use the same runId & projectRoot as your attach call'
    );
  }

  const rootCauseResults = await readRunResultsDirToMap(rootCauseRunResultsPath);
  const conclusion = prepareRunConclusionFromOnlyRootCauseResults(runId, dateConstructor.now(), rootCauseResults);

  return conclusion;
}

function prepareRunConclusionFromOnlyRootCauseResults(
  runId: string,
  timestamp: number,
  data: Map<string, RootCauseRunResultEntry>
): RunConclusionFile {
  const conclusion: RunConclusionFile = {
    runId,
    timestamp,
    tests: [...data]
      .map(([id, entry]) => ({
        id,
        name: entry.testData.metadata.testName,
        fullName: entry.testData.metadata.testFullName,
        suiteFilePath: entry.testData.metadata.fileName || __filename,
        reason: entry.testData.metadata.testEndStatus?.success
          ? undefined
          : ((entry.testData.metadata.testEndStatus?.error as any)?.message as string),
        success: entry.testData.metadata.testEndStatus?.success ?? true,
        timestamp: entry.testData.metadata.timestamp,
        endedTimestamp: entry.testData.metadata.endedTimestamp,
      }))
      .sort((a, b) => b.timestamp - a.timestamp),
  };

  return conclusion;
}
