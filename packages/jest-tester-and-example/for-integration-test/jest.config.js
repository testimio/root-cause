'use strict';

// it's tricky to on the file transpile reporter & setupFilesAfterEnv
// Must first to build the package
// and have dist in the path
// eslint-disable-next-line import/no-extraneous-dependencies
const tsJestPreset = require('ts-jest/jest-preset');
// eslint-disable-next-line import/no-extraneous-dependencies
const puppeteerPreset = require('jest-puppeteer-preset/jest-preset.json');

// read runId from root jest config if defined
const runId = global.runId || Date.now().toString();

module.exports = {
  ...tsJestPreset,
  ...puppeteerPreset,
  reporters: [['./reporter', { runId }]],
  setupFilesAfterEnv: ['expect-puppeteer', './forSetupFilesAfterEnv'],
  transformIgnorePatterns: [],
  globals: {
    runId,
  },
};
