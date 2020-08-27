# Testim Root Cause

This is the [Testim Root Cause](https://www.testim.io/root-cause/) monorepo. Please check out [the documentation](https://help.testim.io/docs/root-cause).


![Root Cause](https://user-images.githubusercontent.com/1315533/91361835-d129a480-e801-11ea-96c7-a22b8ee98046.gif)

Please see the [contributing guide](CONTRIBUTING.md) and note this project has a [Code Of Conduct](CODE_OF_CONDUCT.md)

## Getting Started

Please check out the getting started guide with [Jest](https://help.testim.io/docs/root-cause-jest-integration-guide), [Mocha](https://help.testim.io/docs/root-cause-mocha-integration) or [without Jest or Mocha](https://help.testim.io/docs/getting-started-with-root-cause).


## Testim Root Cause

Root Cause is a tool for troubleshooting Puppeteer and Playwright tests.

We believe modern automation frameworks like Puppeteer, Playwright and Selenium are pretty fast and useful but maintaining and debugging tests is hard.

Root Cause adds features to simplify root cause analysis of Puppeteer and Playwright test runs. Root Cause captures screenshots, network HAR files, and console logs from each test run and saves them to a local drive. The screenshots highlight the action taken at each step and are easily viewed in succession through an intuitive UI to demonstrate the test flow or to identify where a test failed. Additionally, the console logs are parsed to each test step and network HAR is available to deep-dive into failed steps.

Note that this project is a yarn workspace and packages inside have specific READMEs.

### Testim.io

![Testim Logo](https://www.testim.io/wp-content/uploads/2019/11/testim-logo.svg)

This project is maintained and supported with ❤️ by [Testim.io](https://testim.io).

# License

[AGPL](LICENSE).
