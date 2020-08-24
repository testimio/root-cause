// eslint-disable-next-line import/no-extraneous-dependencies
import * as concurrently from 'concurrently';
import * as path from 'path';

const TUNNEL_PORT = 3000;

async function codelessTestRun() {
    const exitCodes = await concurrently([
        // {
        //     name: 'CRA start',
        //     command: 'yarn workspace @testim/root-cause-client-bundled start',
        //     env: {
        //         BROWSER: 'none',
        //         REACT_APP_SERVER_PROXY: '1',
        //     },
        // },
        //  Using built bundle and not cra start due to host mismatch when using tunnel
        // --tunnel-host-header didn't work for me ATM, need to revisit
        {
            name: 'CRA start',
            command: `yarn workspace @testim/root-cause-client-bundled build && yarn workspace @testim/root-cause-client-bundled http-server build -p ${TUNNEL_PORT} --proxy http://localhost:9876/`,
            env: {
                REACT_APP_SERVER_PROXY: '1',
                ...process.env,
            },
        },
        {
            name: 'Fixtures server',
            command: 'yarn workspace @testim/root-cause-core ts-node lib/standaloneServer.ts',
            env: {
                INJECTED_TEST_DIR: path.resolve(process.cwd(), 'packages/root-cause-core/lib/fixtures/runsResults/server-basic'),
                ...process.env,
            },
        },
        {
            name: 'Run test',
            command: `
                testim \
                --tunnel \
                --tunnel-port ${TUNNEL_PORT} \
                --tunnel-host-header "http://localhost:3000" \
                --tunnel-use-http-address \
                --options-file codelessProjectConfig.json \
                --suite "Screenplay local client ui" \
                --report-file reporters-output/screenplay-ui.xml
                `,
        },
    ], {
        killOthers: ['failure', 'success'],
        successCondition: 'first',
    }) as Array<number | string>;

    return exitCodes;
}

codelessTestRun().then((exitCodes) => {
    // eslint-disable-next-line no-console
    console.log('exit codes', exitCodes);
    process.exit(exitCodes[0] as number);
}, err => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
