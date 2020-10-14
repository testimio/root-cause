'use strict';

// @ts-ignore
const playwrightPreset = require('jest-playwright-preset/jest-preset.json');

const config = {
  ...playwrightPreset,
  reporters: ['./reporter'],
  setupFilesAfterEnv: [...playwrightPreset.setupFilesAfterEnv, './setViewportSizeBeforeEach'],
  maxWorkers: '50%',
};

if (!process.env.NO_RC) {
  config.testEnvironment = './RootCauseJestEnvTranspile';
}

module.exports = config;
