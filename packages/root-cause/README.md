# Root Cause

Root Cause is a tool for troubleshooting Puppeteer and Playwright tests.

We believe modern automation frameworks like Puppeteer, Playwright and Selenium are pretty fast and useful but maintaining and debugging tests is hard.

Root Cause adds features to simplify root cause analysis of Puppeteer and Playwright test runs. Root Cause captures screenshots, network HAR files, and console logs from each test run and saves them to a local drive. The screenshots highlight the action taken at each step and are easily viewed in succession through an intuitive UI to demonstrate the test flow or to identify where a test failed. Additionally, the console logs are parsed to each test step and network HAR is available to deep-dive into failed steps.

Reporting on suite and test runs is also easily viewed in the UI to help focus on failed tests, trends, or failure types. 

## Installation + Getting Started

In order to use Root Cause, first install the Node package:
<sup>(You may also use the yarn equivalent commands)</sup>
```sh
npm install @testim/root-cause 
```

## Documentation

Please visit our [Root Cause docs](https://help.testim.io/docs/testim-root-cause-overview) for getting started, usage guides, integration guides and more. 

Read more about what Root Cause does on our [webpage](https://www.testim.io/root-cause/).

## After Installation

- Integrate with Jest or Mocha for test runner support

- Run as standalone RCA tool

- View Root Cause results in the viewer

- Integrate Root Cause with your CI

- Sign up for a [free account](https://app.testim.io) to store results in the cloud 

