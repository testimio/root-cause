'use strict';

/* eslint-disable import/no-extraneous-dependencies */

const tsJestPreset = require('ts-jest/jest-preset');
const playwrightPreset = require('jest-playwright-preset/jest-preset.json');

// read runId from root jest config if defined
const runId = global.runId || Date.now().toString();

module.exports = {
  ...tsJestPreset,
  ...playwrightPreset,
  testEnvironment: '../RootCauseJestEnvTranspile',
  reporters: [['../reporterTranspile', { runId }]],
  globals: {
    runId,
  },
};
