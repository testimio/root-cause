'use strict';

// @ts-ignore
const puppeteerPreset = require('jest-puppeteer-preset/jest-preset.json');

// The run id should be unique across runs
const runId = Date.now().toString();

module.exports = {
  ...puppeteerPreset,
  reporters: [['./reporter', { runId }]],
  setupFilesAfterEnv: [
    ...puppeteerPreset.setupFilesAfterEnv,
    './setupFilesAfterEnv',
    ...(process.env.NO_RC ? [] : ['./forSetupFilesAfterEnv']),
  ],
  globals: {
    runId,
  },
  maxWorkers: '50%',
};
