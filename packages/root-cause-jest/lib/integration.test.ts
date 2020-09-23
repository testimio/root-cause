import childProcess from 'child_process';
import path from 'path';
import { getCleanAllPathsPrettyFormatPlugin } from '@testim/internal-self-tests-helpers';

describe('jest integration test', () => {
  expect.addSnapshotSerializer(getCleanAllPathsPrettyFormatPlugin(process.cwd()));

  test('Validate jest run output and root cause ls', async () => {
    const jestRunResult = await execResults('yarn jest -c for-integration-test/jest.config.js', {
      cwd: path.resolve(__dirname, '../../jest-tester-and-example'),
      env: {
        ...process.env,
        PUPPETEER_WS_ENDPOINT: '',
        TESTIM_PERSIST_RESULTS_TO_CLOUD: '',
        FORCE_COLOR: '0',
      },
    });

    jestRunResult.stderr = jestRunResult.stderr.replace(/Time: .+$/gm, 'Time: NOISE REMOVED');

    jestRunResult.stderr = jestRunResult.stderr.replace(/ ?\([0-9\.]+ m?s\)$/gm, '');

    expect(jestRunResult.stderr).toMatchInlineSnapshot(`
      "FAIL for-integration-test/example1.test.ts
        ● Some test › Test that should fail

          To open in Root Cause viewer, run: npx root-cause show d3f0048d4d0ecd76f6f6b8ebf7051c4a
           Error: No node found for selector: #not-found-element

            136 |           try {
            137 |             const method = reflectedProperty;
          > 138 |             const result = await method.apply(target, args);
                |                            ^
            139 | 
            140 |             for (const afterHook of afterHooks) {
            141 |               try {

            at Object.exports.assert (../../../node_modules/puppeteer/lib/cjs/puppeteer/common/assert.js:26:15)
            at DOMWorld.click (../../../node_modules/puppeteer/lib/cjs/puppeteer/common/DOMWorld.js:273:21)
            at Proxy.rootCauseWrappedFunction (../../root-cause-core/lib/PuppeteerPageHooker.ts:138:28)
            at Object.<anonymous> (example1.test.ts:12:5)'

      Test Suites: 1 failed, 1 total
      Tests:       1 failed, 1 passed, 2 total
      Snapshots:   0 total
      Time: NOISE REMOVED
      Ran all test suites.
      error Command failed with exit code 1.
      "
    `);

    const rootCauseLs = await execResults(
      'node -r ts-node/register ../root-cause-core/lib/cli.ts ls',
      {
        cwd: path.resolve(__dirname, '../../jest-tester-and-example'),
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
            │    0    │ '6e6e4ddf5d0c7c93b126e27ec5167e35' │    'First Test pass'    │  true   │
            │    1    │ 'd3f0048d4d0ecd76f6f6b8ebf7051c4a' │ 'Test that should fail' │  false  │
            └─────────┴────────────────────────────────────┴─────────────────────────┴─────────┘
            ",
            }
        `);
  }, 120_000);
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
