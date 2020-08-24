'use strict';

const playwrightPreset = require('jest-playwright-preset/jest-preset.json');

const runId = Date.now().toString();

module.exports = {
    ...playwrightPreset,
    testRunner: 'jasmine2',
    reporters: [
        ['@testim/root-cause-jest/lib/reporter/default', { runId }],
    ],
    setupFilesAfterEnv: [...playwrightPreset.setupFilesAfterEnv, '@testim/root-cause-jest/lib/forSetupFilesAfterEnv'],
    globals: {
        runId,
    },
};
