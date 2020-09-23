import type { TestResultFile, RunHistoryRecord, RunConclusionFile, RunnerResultEntry } from '@testim/root-cause-types';
import fs from 'fs-extra';
import pMap from 'p-map';
import pFilter from 'p-filter';
import path from 'path';
import {
  RUN_CONCLUSION_FILE_NAME,
  HISTORY_FILE_NAME,
  RUNS_DIR_NAME,
  TEST_RESULTS_FILE_NAME,
  HISTORY_RUNS_TO_RETAIN,
} from '../consts';
import { RootCauseRunResultEntry } from './interfaces';

export async function concludeRun(
  runId: string,
  rootCausePath: string,
  timestamp: number,
  finalResults: Map<
    string,
    {
      runner: RunnerResultEntry;
      rootCause: RootCauseRunResultEntry;
    }
  >
) {
  const conclusion = prepareRunConclusion(runId, timestamp, finalResults);
  await writeRunConclusion(rootCausePath, runId, conclusion);
  const history = await readRunsHistory(rootCausePath);
  // We may here also actually delete old files
  updateRunsHistory(history, conclusion, HISTORY_RUNS_TO_RETAIN);
  await writeRunsHistory(rootCausePath, history);
}

export async function readRunsHistory(rootCauseDirPath: string): Promise<RunHistoryRecord[]> {
  try {
    // final may not be exits yet
    // we may want to handle other errors differently
    return JSON.parse(await fs.readFile(path.resolve(rootCauseDirPath, HISTORY_FILE_NAME), 'utf8'));
  } catch (e) {
    return [];
  }
}

export function updateRunsHistory(history: RunHistoryRecord[], conclusion: RunConclusionFile, historyToKeep: number) {
  // When we don't have real runId, but the default one, that happens
  const runIdAlreadyInUse = history.findIndex((h) => h.runId === conclusion.runId);
  if (runIdAlreadyInUse > -1) {
    history.splice(runIdAlreadyInUse, 1);
  }

  history.unshift({
    runId: conclusion.runId,
    timestamp: conclusion.timestamp,
  });

  history.splice(historyToKeep);
}

export async function writeRunsHistory(rootCauseDirPath: string, history: RunHistoryRecord[]): Promise<void> {
  return fs.writeFile(path.resolve(rootCauseDirPath, HISTORY_FILE_NAME), JSON.stringify(history, null, 2));
}

export async function writeRunConclusion(
  rootCauseDirPath: string,
  runId: string,
  conclusion: RunConclusionFile
): Promise<void> {
  return fs.writeFile(
    path.resolve(rootCauseDirPath, RUNS_DIR_NAME, runId, RUN_CONCLUSION_FILE_NAME),
    JSON.stringify(conclusion, null, 2)
  );
}

export async function readRunConclusion(rootCauseDirPath: string, runId: string): Promise<RunConclusionFile> {
  return JSON.parse(
    await fs.readFile(path.resolve(rootCauseDirPath, RUNS_DIR_NAME, runId, RUN_CONCLUSION_FILE_NAME), 'utf8')
  );
}

export function prepareRunConclusion(
  runId: string,
  timestamp: number,
  data: Map<
    string,
    {
      runner: RunnerResultEntry;
      rootCause: RootCauseRunResultEntry;
    }
  >
): RunConclusionFile {
  const conclusion: RunConclusionFile = {
    runId,
    timestamp,
    tests: [...data].map(([id, entry]) => ({
      id,
      suiteFilePath: entry.runner.suiteFilePath,
      name: entry.runner.testResult.title,
      fullName: entry.runner.testResult.fullName,
      success: entry.runner.testResult.status === 'passed',
      timestamp: entry.rootCause.testData.metadata.timestamp,
      endedTimestamp: entry.rootCause.testData.metadata.endedTimestamp,
      reason:
        entry.rootCause.testData.metadata.testEndStatus?.success === false
          ? (entry.rootCause.testData.metadata.testEndStatus?.error as any)?.message
          : undefined,
    })),
  };

  return conclusion;
}

export function intersectRunnerAndRootCause(
  rootCauseSide: Map<string, RootCauseRunResultEntry>,
  runnerSide: Map<string, RunnerResultEntry>
) {
  const finalMap = new Map<
    string,
    {
      runner: RunnerResultEntry;
      rootCause: RootCauseRunResultEntry;
    }
  >();

  for (const [testId, rootCauseEntry] of rootCauseSide) {
    const runnerEntry = runnerSide.get(testId);

    // for simplicity we ignore tests with other end status
    if (
      rootCauseEntry &&
      runnerEntry &&
      (runnerEntry.testResult.status === 'passed' || runnerEntry.testResult.status === 'failed')
    ) {
      finalMap.set(testId, {
        runner: runnerEntry,
        rootCause: rootCauseEntry,
      });
    }
    // if we have issues with computing correct id, we will find it here
  }

  return finalMap;
}

// maybe turn into async iterator if there's big number of tests in current run
export async function readRunResultsDirToMap(inputDir: string): Promise<Map<string, RootCauseRunResultEntry>> {
  if (!(await fs.pathExists(inputDir))) {
    return new Map();
  }

  const resultsDirsList = await pFilter(
    await fs.readdir(inputDir),
    async (maybeDirPath) => {
      // we might have leftovers from another run
      if (!(await fs.stat(path.resolve(inputDir, maybeDirPath))).isDirectory()) {
        return false;
      }

      // Skip directories without results TEST_RESULTS_FILE_NAME inside them
      return fs.pathExists(path.resolve(inputDir, maybeDirPath, TEST_RESULTS_FILE_NAME));
    },
    { concurrency: 4 }
  );

  const resultsList = await Promise.all(
    await pMap(
      resultsDirsList,
      async (singleResultDirName) => {
        const singleResultDir = path.resolve(inputDir, singleResultDirName);
        const singleResultFile = path.resolve(singleResultDir, TEST_RESULTS_FILE_NAME);
        const testData: TestResultFile = JSON.parse(await fs.readFile(singleResultFile, 'utf8'));
        const id = singleResultDirName;

        return {
          singleResultDir,
          id,
          testData,
        };
      },
      { concurrency: 4 }
    )
  );

  return new Map(resultsList.map((e) => [e.id, e]));
}
