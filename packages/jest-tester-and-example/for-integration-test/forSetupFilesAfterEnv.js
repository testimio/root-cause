// jest can't transpile transformers on the fly so we help him
// https://github.com/facebook/jest/issues/10105

/* eslint-disable import/no-extraneous-dependencies */
if (!process[Symbol.for('ts-node.register.instance')]) {
  const tsNode = require('ts-node');

  tsNode.register({
    transpileOnly: true,
    compilerOptions: require('@testim/root-cause-jest/tsconfig').compilerOptions,
  });
}
try {
  require('@testim/root-cause-jest/lib/forSetupFilesAfterEnv');
} catch (e) {
  console.error(e);
  throw e;
}
