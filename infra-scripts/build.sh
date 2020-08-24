set -ex
yarn workspace @testim/root-cause-types build
yarn workspace @testim/root-cause-client-bundled build
yarn workspace @testim/root-cause-client-bundled build-craco-lib
yarn workspace @testim/root-cause-core build
yarn workspace @testim/root-cause-mocha build
yarn workspace @testim/root-cause-jest build
yarn workspace @testim/root-cause build
