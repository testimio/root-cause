import { groupAssertionInnerSteps } from './groupAssertionInnerSteps';
import type { TestResultFile } from '@testim/root-cause-types';
const fixture: TestResultFile = require('./fixtures/groupAssertionSteps/results.json');

test('groupAssertionInnerSteps remove grouped: true', () => {
  expect(groupAssertionInnerSteps(fixture.steps, true)).toMatchSnapshot();
});

test('groupAssertionInnerSteps remove grouped: false', () => {
  expect(groupAssertionInnerSteps(fixture.steps, false)).toMatchSnapshot();
});
