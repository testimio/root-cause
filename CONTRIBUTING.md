### Contributing Guide

## Signing the CLA

In order to contribute code you need to sign [the CLA](https://docs.google.com/document/d/1X-EoFIW1PMe8H-DJyZDScsTolPKm22-9P1JgSuiFNfE/edit?usp=sharing) which makes it possible for us to release this code as AGPL but consume it internally in a different license.

If you have any issues wit hthe CLA or signing it please contact us (benji@testim.io / bnaya@testim.io) directly.

## Technical Know-How

This monorepo is managed with yarn workspaces in order to build it:

```shell
# install dependencies
yarn
# run a package, for example the tester
cd packages/jest-tester-and-example
yarn test
```

Because the project is still pretty early if you want to contribute but unsure how please contact us.

Please note our code of conduct. We take it seriously and we value diverse contributions and have a zero tolerance policy towards discrimination of any kind.

### Code formatting & linting

We use prettier for code formatting and eslint for linting.  
It's recommended to ensure that your IDE formatting, prettier and eslint integration is configured properly.

[configure prettier on webstorm](https://prettier.io/docs/en/webstorm.html)  
[configure prettier on vscode](https://prettier.io/docs/en/webstorm.html)

You can re-apply prettier in the whole project using `yarn prettier-apply`

We have validation step for that in pre-push hook and in the CI

## Publish workflow

We use lerna for publishing.

We use [lerna canary publish](https://github.com/lerna/lerna/tree/master/commands/publish#--canary) for PRs.

To release prod packages, we use [lerna from-git workflow](https://github.com/lerna/lerna/tree/master/commands/publish#bump-from-git).  
You need to run `lerna version` locally on master branch. it will create version commit, tags and push it to the git remote

Our versioning strategy is `dependent` and not `independent`. means all of the released packages will have the same version.

### We are not semver compatible yet! keep version number below 1.0

For all the other details, look at [.circleci/config.yml](.circleci/config.yml)
