import childProcess from 'child_process';
import path from 'path';

import {
  getCleanAllPathsPrettyFormatPlugin,
  getMochaTestTimeZeroPrettyFormatPlugin,
} from '@testim/internal-self-tests-helpers';

describe('Mocha integration test', () => {
  expect.addSnapshotSerializer(getCleanAllPathsPrettyFormatPlugin(process.cwd()));
  expect.addSnapshotSerializer(getMochaTestTimeZeroPrettyFormatPlugin());

  test('Validate mocha run output and root cause ls', async () => {
    const { stdout: mochaPath } = await execResults('yarn bin mocha');

    const mochaRunResult = await execResults(
      `${mochaPath.trim()} -r ts-node/register -r src/rootHooks.ts src/example-tests/*.test.ts --reporter ./src/reporter.ts`,
      {
        cwd: path.resolve(__dirname, '../'),
        env: { ...process.env, LAUNCH_PUPPETEER: '1', TESTIM_PERSIST_RESULTS_TO_CLOUD: '' },
      }
    );

    expect(mochaRunResult).toMatchInlineSnapshot(`
      Object {
        "error": null,
        "stderr": "",
        "stdout": "

        for parallel
          ✓ First Test pass (TEST TIME NOISE REMOVED)
          1) Test that should fail

        Some mocha test
          ✓ First Test pass (TEST TIME NOISE REMOVED)
          2) Test that should fail


        2 passing (TEST TIME NOISE REMOVED)
        2 failing

        1) for parallel
             Test that should fail:
           Error: No node found for selector: #not-found-element
            at Object.exports.assert (noise_removed/node_modules/puppeteer/lib/cjs/puppeteer/common/assert.js:26:15)
            at DOMWorld.click (noise_removed/node_modules/puppeteer/lib/cjs/puppeteer/common/DOMWorld.js:273:21)
            at processTicksAndRejections (internal/process/task_queues.js:97:5)
            at Proxy.rootCauseWrappedFunction (noise_removed/packages/root-cause-core/lib/PuppeteerPageHooker.ts:156:28)
            at Context.<anonymous> (src/example-tests/for-parallel.test.ts:20:5)

        2) Some mocha test
             Test that should fail:
           Error: No node found for selector: #not-found-element
            at Object.exports.assert (noise_removed/node_modules/puppeteer/lib/cjs/puppeteer/common/assert.js:26:15)
            at DOMWorld.click (noise_removed/node_modules/puppeteer/lib/cjs/puppeteer/common/DOMWorld.js:273:21)
            at processTicksAndRejections (internal/process/task_queues.js:97:5)
            at Proxy.rootCauseWrappedFunction (noise_removed/packages/root-cause-core/lib/PuppeteerPageHooker.ts:156:28)
            at Context.<anonymous> (src/example-tests/some.test.ts:25:5)



      ",
      }
    `);

    const rootCauseLs = await execResults(
      'node -r ts-node/register ../root-cause-core/lib/cli.ts ls',
      {
        cwd: path.resolve(__dirname, '../'),
        env: { ...process.env, LAUNCH_PUPPETEER: '1' },
      }
    );

    rootCauseLs.stdout = rootCauseLs.stdout.replace(/Run id: [^\n]+/, 'Run id: noise removed');
    rootCauseLs.stdout = rootCauseLs.stdout.replace(/Run time: [^\n]+/, 'Run time: noise removed');

    expect(rootCauseLs).toMatchInlineSnapshot(`
            Object {
              "error": null,
              "stderr": "",
              "stdout": "Run id: noise removed
            Run time: noise removed
            ┌─────────┬────────────────────────────────────┬─────────────────────────┬─────────┐
            │ (index) │                 id                 │          name           │ success │
            ├─────────┼────────────────────────────────────┼─────────────────────────┼─────────┤
            │    0    │ 'baadb4d3faebc9597fbf258363b6d00d' │    'First Test pass'    │  true   │
            │    1    │ 'c5a3ff9f45d45c0e710d55894c996ffd' │ 'Test that should fail' │  false  │
            │    2    │ '75db1babdd3f162fe1e421fd2d6c3b55' │    'First Test pass'    │  true   │
            │    3    │ '55b296e60f26bc3596b910c1ca6d6f51' │ 'Test that should fail' │  false  │
            └─────────┴────────────────────────────────────┴─────────────────────────┴─────────┘
            ",
            }
        `);
  }, 30_000);
});

async function execResults(command: string, options?: childProcess.ProcessEnvOptions) {
  return new Promise<{
    error: childProcess.ExecException | null;
    stderr: string;
    stdout: string;
  }>((res) => {
    childProcess.exec(command, options, (error, stdout, stderr) => {
      res({
        error,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      });
    });
  });
}
