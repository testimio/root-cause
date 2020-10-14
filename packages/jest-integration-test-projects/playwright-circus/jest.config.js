'use strict';

/* eslint-disable import/no-extraneous-dependencies */

const tsJestPreset = require('ts-jest/jest-preset');
const playwrightPreset = require('jest-playwright-preset/jest-preset.json');

module.exports = {
  ...tsJestPreset,
  ...playwrightPreset,
  testEnvironment: '../RootCauseJestEnvTranspile',
  reporters: ['../reporterTranspile'],
};
