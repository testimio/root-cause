import {
    readRunResultsDirToMap, writeRunConclusion, readRunsHistory, updateRunsHistory, writeRunsHistory,
} from './runConclusion/runConclusionUtils';
import { constructScreenplayResultDir, constructTestInvocationResultDir } from './utils';
import { FALLBACK_RUN_ID, HISTORY_RUNS_TO_RETAIN } from './consts';
import fs from 'fs-extra';
import type { RootCauseRunResultEntry } from './runConclusion/interfaces';
import type { RunConclusionFile } from '@testim/root-cause-types';

/**
 * To be used explicitly when there's no test runner
 */
export async function updateHistoryFromScreenplayResultsOnly(runId = FALLBACK_RUN_ID, projectRoot = process.cwd(), dateConstructor = Date) {
    const screenplayPath = constructScreenplayResultDir(projectRoot);
    const screenplayRunResultsPath = constructTestInvocationResultDir(projectRoot, runId);

    if (!await fs.pathExists(screenplayPath)) {
        throw new Error('None existing screenplay path, make sure you use the same projectRoot as your attach call');
    }

    if (!await fs.pathExists(screenplayRunResultsPath)) {
        throw new Error('None existing screenplay runs path, make sure you use the same runId & projectRoot as your attach call');
    }

    const screenplayResults = await readRunResultsDirToMap(screenplayRunResultsPath);
    const conclusion = prepareRunConclusionFromOnlyScreenplayResults(runId, dateConstructor.now(), screenplayResults);
    await writeRunConclusion(screenplayPath, runId, conclusion);
    const history = await readRunsHistory(screenplayPath);
    // We may here also actually delete old files
    updateRunsHistory(history, conclusion, HISTORY_RUNS_TO_RETAIN);
    await writeRunsHistory(screenplayPath, history);
}

export async function readHistoryFallback(runId = FALLBACK_RUN_ID, projectRoot = process.cwd(), dateConstructor = Date): Promise<RunConclusionFile> {
    const screenplayPath = constructScreenplayResultDir(projectRoot);
    const screenplayRunResultsPath = constructTestInvocationResultDir(projectRoot, runId);

    if (!await fs.pathExists(screenplayPath)) {
        throw new Error('None existing screenplay path, make sure you use the same projectRoot as your attach call');
    }

    if (!await fs.pathExists(screenplayRunResultsPath)) {
        throw new Error('None existing screenplay runs path, make sure you use the same runId & projectRoot as your attach call');
    }

    const screenplayResults = await readRunResultsDirToMap(screenplayRunResultsPath);
    const conclusion = prepareRunConclusionFromOnlyScreenplayResults(runId, dateConstructor.now(), screenplayResults);

    return conclusion;
}

function prepareRunConclusionFromOnlyScreenplayResults(runId: string, timestamp: number, data: Map<string, RootCauseRunResultEntry>): RunConclusionFile {
    const conclusion: RunConclusionFile = {
        runId,
        timestamp,
        tests: [...data].map(([id, entry]) => ({
            id,
            name: entry.testData.metadata.testName,
            fullName: entry.testData.metadata.testFullName,
            suiteFilePath: entry.testData.metadata.fileName || __filename,
            reason: entry.testData.metadata.testEndStatus?.success ? undefined : (entry.testData.metadata.testEndStatus?.error as any)?.message as string,
            success: entry.testData.metadata.testEndStatus?.success ?? true,
            timestamp: entry.testData.metadata.timestamp,
            endedTimestamp: entry.testData.metadata.endedTimestamp,
        })).sort((a, b) => b.timestamp - a.timestamp),
    };

    return conclusion;
}
