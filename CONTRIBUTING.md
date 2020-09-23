# Contributing Guide 

## Signing the CLA

In order to contribute code you need to sign [the CLA](https://docs.google.com/document/d/1X-EoFIW1PMe8H-DJyZDScsTolPKm22-9P1JgSuiFNfE/edit?usp=sharing) which makes it possible for us to release this code as AGPL but consume it internally in a different license.

If you have any issues with the CLA or signing it please contact us (benji@testim.io / bnaya@testim.io) directly.


## Technical Know-How

This monorepo is managed with yarn workspaces.  
The codebase is written with TypeScript, and linted using ESLint.  
It's recommended to have properer IDE integration with the tools in use (eslint, editorconfig) before modifying the code

### Prerequisite
- yarn [Installation instructions](https://classic.yarnpkg.com/en/docs/install/#mac-stable)
- node 12/14 [Installation instructions](https://nodejs.org/en/download/package-manager/)

## Dependencies install
The first step for local development would be to install the dependencies
```sh
# install dependencies
yarn
```

## Running the tests
To run the whole test suite:
```sh
yarn test
```
On a clean clone, the test are expected to pass. if they don't, please let us know!

You can also run per package tests:
```sh
cd packages/root-cause-jest
yarn test
yarn root-cause ls;
```

## Building
There is no need to run any build step when running tests or internal examples,
the needed transpilation/build is happening on the fly.  
To achieve that, we make extensive use of `ts-node` in various ways.

To see how we build for publishing, go over our [.circleci/config.yml](.circleci/config.yml)

## To run jest local example:

```sh
cd packages/jest-tester-and-example
yarn test
yarn root-cause ls;
```

Because the project is still in pretty early stage, if you want to contribute but unsure how please contact us.

Please note our code of conduct. We take it seriously and we value diverse contributions and have a zero tolerance policy towards discrimination of any kind.

## root-cause cli while developing
yarn 1 does not link bin files between workspaces.
So we've added package scripts to be used instead while developing.
That means you can simply run `yarn root-cause` as expected.
```json
// package.json
"root-cause": "ts-node ../root-cause-core/lib/cli",
"rc": "ts-node ../root-cause-core/lib/cli"
```

## Viewer UI/frontend development
The viewer UI is a create-react-app(CRA) project, found in packages/client.  

When working on the UI, the recommended workflow would be:
- Run some test that will create root cause results
- Open the root cause viewer in one terminal tab, and pick the result you want, and keep it running
- Start CRA watch mode in **another** terminal tab:
`yarn workspace @testim/root-cause-client-bundled start`
(or `yarn start` from inside the client directory)

## Issues
If you've encountered any unexpected error in that above steps, please let us know!

## Publish workflow

We use lerna for publishing.

We use [lerna canary publish](https://github.com/lerna/lerna/tree/master/commands/publish#--canary) for PRs.  

To release prod packages, we use [lerna from-git workflow](https://github.com/lerna/lerna/tree/master/commands/publish#bump-from-git).  
You need to run `lerna version` locally on master branch. it will create version commit, tags and push it to the git remote

Our versioning strategy is `dependent` and not `independent`. means all of the released packages will have the same version. **We are not semver compatible yet! keep version number below 1.0**
