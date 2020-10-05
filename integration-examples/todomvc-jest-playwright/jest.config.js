'use strict';

// @ts-ignore
const playwrightPreset = require('jest-playwright-preset/jest-preset.json');

// The run id should be unique across runs
const runId = Date.now().toString();

module.exports = {
  ...playwrightPreset,
  testRunner: 'jasmine2',
  reporters: [['./reporter', { runId }]],
  setupFilesAfterEnv: [
    ...playwrightPreset.setupFilesAfterEnv,
    './setupFilesAfterEnv',
    ...(process.env.NO_RC ? [] : ['./forSetupFilesAfterEnv']),
  ],
  globals: {
    runId,
  },
  maxWorkers: '50%',
};
