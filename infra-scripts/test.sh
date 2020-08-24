set -ex

yarn workspace @testim/root-cause-core test
yarn workspace @testim/root-cause-mocha test
yarn workspace @testim/root-cause-jest test
yarn workspace @testim/root-cause-jest test:integration
# yarn ts-node infra-scripts/codelessTestRun.ts
