/* eslint-disable import/no-extraneous-dependencies */

// @ts-nocheck

// Avoid registering ts-node twice
if (!process[Symbol.for('ts-node.register.instance')]) {
  const tsNode = require('ts-node');

  tsNode.register({
    transpileOnly: true,
    compilerOptions: require('@testim/root-cause-jest/tsconfig').compilerOptions,
  });
}
const Env = require('@testim/root-cause-jest/lib/RootCauseJestEnv');

module.exports = Env;
