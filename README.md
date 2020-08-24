# Testim Root Cause

This is the Testim Root Cause monorepo.

This monorepo is managed by yarn with workspaces.  
We also use lerna for publishing.

## Publish workflow
We have [lerna canary publish](https://github.com/lerna/lerna/tree/master/commands/publish#--canary) for PR's.  

To release prod packages, we use [lerna from-git workflow](https://github.com/lerna/lerna/tree/master/commands/publish#bump-from-git).  
You need to run `lerna version` locally on master branch. it will create version commit, tags and push it to the git remote

Our versioning strategy is `dependent` and not `independent`. means all of the released packages will have the same version.

## We are not semver compatible yet! keep version number below 1.0

For all the other details, look at [.circleci/config.yml](.circleci/config.yml)
