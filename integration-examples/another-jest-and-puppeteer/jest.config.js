'use strict';

const puppeteerPreset = require('jest-puppeteer-preset/jest-preset.json');

const runId = Date.now().toString(); // // name the suite run somehow
module.exports = {
    ...puppeteerPreset,
    // add the Root Cause Reporter
    reporters: [['@testim/root-cause/src/jest/reporter/default', { runId }]],
    // and tell Testim Root Cause to instrument
    setupFilesAfterEnv: ['expect-puppeteer', '@testim/root-cause/src/jest/forJestSetupFilesAfterEnv'],
    globals: { runId }, // expose it as global
};
