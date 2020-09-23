import { runConclusionToTestimExecution, TestimUserMetadata, GitMetadata } from './runConclusionToTestimExecution';
import type { RunConclusionFile } from '@testim/root-cause-types';

const runConclusionFailed = require('../fixtures/runConclusionFailed.json') as RunConclusionFile;
const runConclusionEmpty = require('../fixtures/runConclusionFailed.json') as RunConclusionFile;
const runConclusionSuccessful = require('../fixtures/runConclusionSuccessful.json') as RunConclusionFile;
const runConclusionFromJest = require('../fixtures/runConclusionFromJest.json') as RunConclusionFile;

const testimMetadata: TestimUserMetadata = {
  projectId: 'ilan-loves-loacker-more-than-life-itself',
  companyId: 'dogs-that-lose-weight-are-healthier',
  resultLabels: ['rootCause'],
};

let i = 0;
const guid = (n?: number) => `${i++}`;

describe('the run conclusion file conversion', () => {
  //TODO(Benji) replace this when useFakeTimers('modern') doesn't throw after we upgrade jest.
  const oldDateNow = Date.now;
  const toLocaleString = Date.prototype.toLocaleString;
  beforeAll(() => {
    // eslint-disable-next-line no-extend-native
    Date.now = () => i++;
    // eslint-disable-next-line no-extend-native
    Date.prototype.toLocaleString = () => '0/0/0';
  });
  afterAll(() => {
    // eslint-disable-next-line no-extend-native
    Date.now = oldDateNow;
    // eslint-disable-next-line no-extend-native
    Date.prototype.toLocaleString = toLocaleString;
  });
  it('converts an empty runConclusions file to a testim execution', () => {
    expect(runConclusionToTestimExecution(runConclusionEmpty, testimMetadata, undefined, guid)).toMatchSnapshot();
  });
  it('converts a runConclusions file of several test to a testim execution', () => {
    expect(runConclusionToTestimExecution(runConclusionFailed, testimMetadata, undefined, guid)).toMatchSnapshot();
    expect(runConclusionToTestimExecution(runConclusionSuccessful, testimMetadata, undefined, guid)).toMatchSnapshot();
  });
  it('converts a runConclusions file of a jest test suite to a testim execution', () => {
    expect(runConclusionToTestimExecution(runConclusionFromJest, testimMetadata, undefined, guid)).toMatchSnapshot();
  });
  it('converts a runConclusions file of a jest test suite to a testim execution with git metadata', () => {
    const gitMetadata: GitMetadata = {
      gitBranch: 'main',
      gitCommit: '3123364',
      gitRepoUrl: '#doglivesmatter#ingoldawetrust',
    };
    expect(runConclusionToTestimExecution(runConclusionFromJest, testimMetadata, gitMetadata, guid)).toMatchSnapshot();
  });
});
