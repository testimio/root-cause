/* eslint-disable import/no-extraneous-dependencies */

// jest can't transpile reporters on the fly so we help him
// https://github.com/facebook/jest/issues/10105

// make sure ts-node is loaded only once
if (!process[Symbol.for('ts-node.register.instance')]) {
  const tsNode = require('ts-node');

  tsNode.register({
    transpileOnly: true,
    compilerOptions: require('@testim/root-cause-jest/tsconfig').compilerOptions,
  });
}

const Reporter = require('@testim/root-cause-jest/lib/reporter/default');

module.exports = Reporter;
