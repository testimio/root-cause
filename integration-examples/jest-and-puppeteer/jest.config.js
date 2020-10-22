'use strict';

module.exports = {
  preset: 'jest-puppeteer-preset',
  testEnvironment: '@testim/root-cause-jest/lib/RootCauseJestEnv',
  reporters: ['@testim/root-cause-jest/lib/reporter/default'],
};
