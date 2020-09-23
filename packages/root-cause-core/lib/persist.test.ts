import { generateJunitReport } from './persist';
import { TestimBackendExecutionFormatSubsetForReporting } from './testim-services-api/interfaces';

const dummyProjectId = 'brave-dog';

function makeExampleExecution(
  name = 'Example Execution',
  execution: TestimBackendExecutionFormatSubsetForReporting['execution'] = {}
): TestimBackendExecutionFormatSubsetForReporting {
  return {
    runId: '1',
    execution,
    startTime: 1,
  };
}
describe('the jUnit reporter for cloud executions', () => {
  it('generates an empty report if there are no tests', () => {
    const report = generateJunitReport({
      projectId: dummyProjectId,
      testimExecution: makeExampleExecution(),
    });
    expect(report).toMatchSnapshot();
  });
  it('generates a report with one test if the execution contains a single test', () => {
    const report = generateJunitReport({
      projectId: dummyProjectId,
      testimExecution: makeExampleExecution('Example Execution One Test', {
        resultId: {
          testId: 'testId',
          name: 'some test',
          success: true,
          resultId: 'someResultId',
          parentResultId: 'parentResultId',
          isTestsContainer: false,
        },
        parentResultId: {
          testId: 'parentTestId',
          name: 'some test',
          success: true,
          resultId: 'someResultId',
          isTestsContainer: true,
        },
      }),
    });
    expect(report).toMatchSnapshot();
  });
  it('generates a report with several tests if the execution contains several tests', () => {
    const report = generateJunitReport({
      projectId: dummyProjectId,
      testimExecution: makeExampleExecution('Example Execution Two Tests', {
        resultId: {
          testId: 'testId',
          name: 'some test',
          success: true,
          resultId: 'someResultId',
          parentResultId: 'parentResultId',
          isTestsContainer: false,
        },
        resultId2: {
          testId: 'testId2',
          name: 'some other test',
          success: true,
          resultId: 'someResultId',
          parentResultId: 'parentResultId',
          isTestsContainer: false,
        },
        parentResultId: {
          testId: 'parentTestId',
          name: 'some test',
          success: true,
          resultId: 'someResultId',
          isTestsContainer: true,
        },
      }),
    });
    expect(report).toMatchSnapshot();
  });
  it('generates a report with failed tests if a test failed', () => {
    const report = generateJunitReport({
      projectId: dummyProjectId,
      testimExecution: makeExampleExecution('Example Execution One Test', {
        resultId: {
          testId: 'testId',
          name: 'some test',
          success: false,
          resultId: 'someResultId',
          parentResultId: 'parentResultId',
          isTestsContainer: false,
        },
        parentResultId: {
          testId: 'parentTestId',
          name: 'some test',
          success: false,
          resultId: 'someResultId',
          isTestsContainer: true,
        },
      }),
    });
    expect(report).toMatchSnapshot();
  });
});
