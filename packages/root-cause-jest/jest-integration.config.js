'use strict';

/**
 * The reason we need separate jest config, and to run jest separately,
 * Is that this test when ran with the rest of the tests gets everything crazy on circle ci
 * locally it was passing
 */
module.exports = {
  preset: 'ts-jest',
  testMatch: ['<rootDir>/lib/integration.test.ts'],
};
