## ScreenPlay Cloud

This guide assumes that you have already read the [quick start guide](quick-start-guide.md) and have ScreenPlay runnining in local mode.

## Why Cloud Results:

Cloud results give you the ability to debug test failures quickly and efficiently:

 - Share links to test results between people including all the test metadata.
 - Get rich reports about test health and see past test runs and failures of you and your team.

## How to integrate Cloud Results

In order to persist results to the cloud you need a Testim.io account:

 - Type `screenplay login` which opens the app.testim.io screen and create an account
 - Go to the "Settings" tab, pick "CLI" and pick "ScreenPlay"
 - Copy the relevant configuration to your project into the CLI 
   - Note that if you are using a CI that is supported - set the same environment variables.

That's it! Just setting `TESTIM_PERSIST_RESULTS_TO_CLOUD` will automatically get the jest/launch integration to work.

## Manual Integration

If you are using manual ScreenPlay integration (the `.attach` api) - a `persist()` method is exposed which you need to call when the test is done.