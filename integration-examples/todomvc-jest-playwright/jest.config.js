'use strict';

// @ts-ignore
const playwrightPreset = require('jest-playwright-preset/jest-preset.json');

// The run id should be unique across runs
const runId = Date.now().toString();

const config = {
  ...playwrightPreset,
  reporters: [['./reporter', { runId }]],
  setupFilesAfterEnv: [...playwrightPreset.setupFilesAfterEnv, './setViewportSizeBeforeEach'],
  globals: {
    runId,
  },
  maxWorkers: '50%',
};

if (!process.env.NO_RC) {
  config.testEnvironment = './RootCauseJestEnvTranspile';
}

module.exports = config;
