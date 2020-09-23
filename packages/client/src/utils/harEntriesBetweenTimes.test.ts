import { harEntriesInTimeRange } from './harEntriesInTimeRange';
import harContent from './fixtures/forHarEntriesBetweenTimes/networkLogs.har.json';
import testResults from './fixtures/forHarEntriesBetweenTimes/results.json';
import type { Har, Entry } from 'har-format';

// @ts-ignore
const harContentWithType: Har = harContent;

function entryInterestingParts(entry: Entry) {
  return {
    url: entry.request.url,
    method: entry.request.method,
    startTime: entry.startedDateTime,
    status: entry.response.status,
    statusText: entry.response.statusText,
  };
}

describe('harEntriesInTimeRange', () => {
  test('First step from fixture goto http://jsbin.testim.io/ces', () => {
    const firstStep = testResults.steps[0];

    const { startTimestamp, endTimestamp } = firstStep;

    const startDate = new Date(startTimestamp);
    const endDate = new Date(endTimestamp);
    const r = harEntriesInTimeRange(harContentWithType, startDate, endDate).map(entryInterestingParts);

    expect(r).toMatchSnapshot();
  });

  test('click [data-job=GET_OK]', () => {
    const firstStep = testResults.steps[1];

    const { startTimestamp, endTimestamp } = firstStep;

    const startDate = new Date(startTimestamp);
    const endDate = new Date(endTimestamp);
    const r = harEntriesInTimeRange(harContentWithType, startDate, endDate).map(entryInterestingParts);

    expect(r).toMatchSnapshot();
  });

  test('click [data-job=GET_404]', () => {
    const firstStep = testResults.steps[2];

    const { startTimestamp, endTimestamp } = firstStep;

    const startDate = new Date(startTimestamp);
    const endDate = new Date(endTimestamp);
    const r = harEntriesInTimeRange(harContentWithType, startDate, endDate).map(entryInterestingParts);

    expect(r).toMatchSnapshot();
  });

  test('click [data-job=POST_OK]', () => {
    const firstStep = testResults.steps[3];

    const { startTimestamp, endTimestamp } = firstStep;

    const startDate = new Date(startTimestamp);
    const endDate = new Date(endTimestamp);
    const r = harEntriesInTimeRange(harContentWithType, startDate, endDate).map(entryInterestingParts);

    expect(r).toMatchSnapshot();
  });

  test('click [data-job=POST_404]', () => {
    const firstStep = testResults.steps[4];

    const { startTimestamp, endTimestamp } = firstStep;

    const startDate = new Date(startTimestamp);
    const endDate = new Date(endTimestamp);
    const r = harEntriesInTimeRange(harContentWithType, startDate, endDate).map(entryInterestingParts);

    expect(r).toMatchSnapshot();
  });
});
