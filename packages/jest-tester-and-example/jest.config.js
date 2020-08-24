'use strict';

const runId = Date.now().toString();
// propagate same runId for sub-jest project will share the same
global.runId = runId;

module.exports = {
    reporters: [
        ['@testim/screenplay/dist/src/jest/reporter/default', { runId }],
    ],
    projects: [
        '<rootDir>/with-jest-puppeteer/jest.config.js',
        '<rootDir>/with-playwright-manual-integration/jest.config.js',
    ],
    globals: {
        runId,
    },
};
