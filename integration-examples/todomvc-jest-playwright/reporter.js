// @ts-nocheck

/* eslint-disable import/no-extraneous-dependencies */
if (!process[Symbol.for('ts-node.register.instance')]) {
  const tsNode = require('ts-node');

  tsNode.register({
    transpileOnly: true,
    compilerOptions: require('@testim/root-cause-jest/tsconfig').compilerOptions,
    // skipIgnore: true,
    // ignore: [],
  });
}
const Reporter = require('@testim/root-cause-jest/lib/reporter/default');

module.exports = Reporter;
