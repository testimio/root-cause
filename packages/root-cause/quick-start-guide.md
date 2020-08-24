# ** deprecated **
## Installation + Getting Started

In order to use ScreenPlay, first install the Node.js package:
<sup>(You may also use the yarn equivalent commands)</sup>
```sh
npm install @testim/screenplay -D
```

## Usage with standalone Node code (for custom scenarios, no test runner)

This collects useful root cause analysis information (like located elements, screenshots, console logs, and other Puppeteer calls) automatically:

[For a working example, see our examples repository](https://github.com/testimio/screenplay-issues/tree/master/integration-examples/launch-api)

```js
const screenplay = require('@testim/screenplay');
 
screenplay.launch({ testName: "My screenplay test" }, async page => {
    // use the page object normally like you regularly would
 
    await page.goto('https://example.com');
    await page.click('a');
});
```

## Jest integration

[For a working **puppeteer** examples](https://github.com/testimio/screenplay-issues/tree/master/integration-examples/jest)  
[For a working **playwright** examples](https://github.com/testimio/screenplay-issues/tree/master/integration-examples/jest-playwright)

For ScreenPlay & Jest integration, we assume you already have Puppeteer/Playwright integration that exposes `browser` & `page` globally.  

Integrating ScreenPlay requires minor Jest config changes.  
If you are not sure how your Jest is configured, see https://jestjs.io/docs/en/configuration.

For the following example, we assume you use [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer) as preset.

`jest.config.js`
```js
const puppeteerPreset = require('jest-puppeteer-preset/jest-preset.json');
const runId = Date.now().toString();

module.exports = {
    ...puppeteerPreset,
    reporters: [
        ['@testim/screenplay/src/jest/reporter/default', { runId }],
    ],
    setupFilesAfterEnv: ['expect-puppeteer', '@testim/screenplay/src/jest/forJestSetupFilesAfterEnv'],
    globals: {
        runId,
    },
};

```

For the following example, we assume you use [jest-playwright](https://github.com/playwright-community/jest-playwright) as preset.

`jest.config.js`
```js
const playwrightPreset = require("jest-playwright-preset/jest-preset.json");

const runId = Date.now().toString();

module.exports = {
    ...playwrightPreset,
    testRunner: "jasmine2",
    reporters: [
        ['@testim/screenplay/src/jest/reporter/default', { runId }],
    ],
    setupFilesAfterEnv: [...playwrightPreset.setupFilesAfterEnv, '@testim/screenplay/src/jest/forJestSetupFilesAfterEnv'],
    globals: {
        runId,
    },
};

```

As we can see in the example, we add a ScreenPlay reporter and ScreenPlay `setupFilesAfterEnv` entry.  
We also pass `runId` as a global Jest variable and as a parameter to the Jest reporter.
The value of `runId` should be unique for each Jest run.

## Viewing ScreenPlay results / ScreenPlay CLI

ScreenPlay saves all of the test data in `.screenplay` folder.  

To list the recent test runs:
```sh
npx screenplay ls
```

Example output:
> ![screenplay-show-interactive](https://user-images.githubusercontent.com/1304862/85405201-b8361600-b568-11ea-8146-3f356d723b44.png)


To see the results of a specific test, copy the id and pass it to the `npx screenplay show`, as following:
```sh
npx screenplay show <result-id>
```

Which will open your default browser with the ScreenPlay viewer that looks something like this:

![screenplay-ui](https://user-images.githubusercontent.com/1315533/84589960-1feab380-ae3b-11ea-85c1-a8ce7712d416.png)

You may omit the id, for interactively selecting the test to show:

> ![screenplay-show-interactive](https://user-images.githubusercontent.com/1304862/85405209-bb310680-b568-11ea-84e2-b435955fb537.png)

To see all of the ScreenPlay CLI possible options
```sh
npx screenplay --help
```

Note that it is recommended to install `@testim/screenplay` locally in your project, so npx will use the local version

## CI Integration
It's possible to use ScreenPlay in your CI, similar to how you would use Puppeteer in your CI. 
See our example projects with GitHub Actions:
https://github.com/testimio/screenplay-issues/blob/master/.github/workflows/screenplay-run-examples.yml.

To watch the ScreenPlay CI results locally, you may download the artifacts folder, and use ScreenPlay CLI as explained above.
