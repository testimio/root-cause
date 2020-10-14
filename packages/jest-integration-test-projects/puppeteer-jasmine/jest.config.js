'use strict';

/* eslint-disable import/no-extraneous-dependencies */

const tsJestPreset = require('ts-jest/jest-preset');
const puppeteerPreset = require('jest-puppeteer-preset/jest-preset.json');

module.exports = {
  ...tsJestPreset,
  ...puppeteerPreset,
  testEnvironment: '../RootCauseJestEnvTranspile',
  reporters: ['../reporterTranspile'],
};
