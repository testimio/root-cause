#! /usr/bin/env node

/* eslint-disable no-console */
import { program } from 'commander';
import open from 'open';
import { openServer } from './server';
import prompts from 'prompts';
import { constructResultDir, constructTestResultDir } from './utils';
import { readRunsHistory, readRunConclusion } from './runConclusion/runConclusionUtils';
import { readHistoryFallback } from './updateHistoryFromRootCauseResultsOnly';
import { persist } from './persist';
import type { RunConclusionFile } from '@testim/root-cause-types';

const serverPort = 9876;
/**
   Overall notes:
   todo:
    we may want to add more graceful handling for when some files are missing,
    and maybe some features for on-going tests
 */

program.version(getVersion());

async function show(testId?: string, { failed: showOnlyFailed = false }: { failed?: boolean } = {}) {
  const resultsDirPath = constructResultDir(process.cwd());
  const history = await readRunsHistory(resultsDirPath);

  let conclusion: RunConclusionFile | null = null;
  let runId = '';
  if (history.length === 0) {
    try {
      conclusion = await readHistoryFallback();
      runId = conclusion.runId;
    } catch (err) {
      if (history.length === 0) {
        console.log('No Root Cause runs found');
        console.log('Make sure you have the .root-cause directory in your working directory');
        return;
      }
    }
  }

  if (!conclusion) {
    const mostRecentHistory = history[0];
    runId = mostRecentHistory.runId;
    conclusion = await readRunConclusion(resultsDirPath, runId);
  }

  if (testId) {
    if (conclusion.tests.findIndex((t) => t.id === testId) === -1) {
      console.error(`Test with id ${testId} is missing`);
      process.exit(1);
      return;
    }

    const url = await openServer(serverPort, constructTestResultDir(process.cwd(), runId, testId));
    open(url);

    console.log('Press any key to exit');

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
  } else {
    const selectedTest = await prompts({
      type: 'select',
      name: 'test',
      message: `Please select which test run to show (runId ${conclusion.runId}):`,
      choices: conclusion.tests
        .filter((t) => (showOnlyFailed ? !t.success : true))
        .map((p) => ({ title: `${p.name} (${p.id})`, value: p.id })),
    });

    if (selectedTest.test !== undefined) {
      show(selectedTest.test);
    } else {
      // probably canceled
      // do nothing
    }
  }
}

async function list({ simple = false, failed: showOnlyFailed = false }: { simple?: boolean; failed?: boolean } = {}) {
  const resultsDirPath = constructResultDir(process.cwd());
  const history = await readRunsHistory(resultsDirPath);
  if (history.length === 0) {
    console.log('No Root Cause runs found');
    return;
  }

  let conclusion: RunConclusionFile | null = null;
  let runId = '';
  if (history.length === 0) {
    try {
      conclusion = await readHistoryFallback();
      runId = conclusion.runId;
    } catch (err) {
      if (history.length === 0) {
        console.log('No Root Cause runs found');
        console.log('Make sure you have the .root-cause directory in your working directory');
        return;
      }
    }
  }

  if (!conclusion) {
    const mostRecentHistory = history[0];
    runId = mostRecentHistory.runId;
    conclusion = await readRunConclusion(resultsDirPath, runId);
  }

  if (simple) {
    for (const test of conclusion.tests) {
      console.log(test.id);
    }

    return;
  }

  console.log(`Run id: ${conclusion.runId}`);
  console.log(`Run time: ${new Date(conclusion.timestamp).toISOString()}`);

  const tableData = conclusion.tests
    .filter((t) => (showOnlyFailed ? !t.success : true))
    .map(({ id, name, success }) => ({
      id,
      name,
      // fullName
      success,
    }));

  console.table(tableData);
}

function version() {
  console.log(getVersion());
}

function getVersion() {
  const version = require('../package.json').version;
  return version;
}

function login() {
  const loginUrl = 'https://app.testim.io/#/signin?fromRootCause=true';
  open(loginUrl);
}

program
  .command('show [testId]')
  .description('shows test result ui')
  .option('-f, --failed', 'show only failed tests')
  .action(show);

program
  .command('persist [runId]')
  .description('persists the given cloud result to the Testim Cloud')
  .option('--result-label [resultLabel]', 'result label to tag at Testim Cloud with')
  .option('--project')
  .option('--token')
  .action(persist);

program
  .command('list')
  .alias('ls')
  .option('-s, --simple', 'print simple output, as unformatted as possible')
  .option('-f, --failed', 'show only failed tests')
  .description('list all Root Cause tests in the last run')
  .action(list);

program.option('-v').description('output the version number').action(version);

program.command('login').description('logs in to testim').action(login);

program.parse(process.argv);
