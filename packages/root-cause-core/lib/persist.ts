import { TestimApi } from './testim-services-api';
import { getTestimCredentials } from './testim-credentials-manager';
import { resolve as pathResolve } from 'path';
import { constructResultDir } from './utils';
import fs from 'fs-extra';
import ora from 'ora';
import untildify from 'untildify';
import {
  TestimBackendExecutionInputFormat,
  TestimBackendExecutionFormatSubsetForReporting,
} from './testim-services-api/interfaces';

export async function persist(
  runId: string,
  {
    projectRoot,
    resultLabel,
    project,
    token,
    jUnitReportPath,
  }: {
    projectRoot?: string;
    resultLabel: string[];
    project?: string;
    token?: string;
    jUnitReportPath?: string;
  }
): Promise<void> {
  if (!runId) {
    console.log('Please pass a valid runId');
    return;
  }
  const credentials =
    project && token ? { projectId: project, ciToken: token } : await getTestimCredentials();
  if (!jUnitReportPath && process.env.TESTIM_PROJECT_JUNIT_PATH) {
    jUnitReportPath = untildify(process.env.TESTIM_PROJECT_JUNIT_PATH);
  }
  if (!credentials.ciToken || !credentials.projectId) {
    console.log(
      'No Root Cause Credentials found, please make sure the TESTIM_PROJECT_ID' +
        ' and TESTIM_PROJECT_TOKEN environment variables are defined.'
    );
    return;
  }
  const api = new TestimApi(process.env.SERVICES_URL);
  await api.authenticate(credentials.projectId, credentials.ciToken);
  const dir = constructResultDir(projectRoot || process.cwd());
  const path = pathResolve(dir, 'runs', runId);

  if (!(await fs.pathExists(path))) {
    console.log('Run does not exist, looked at', path);
    return;
  }
  const spinner = ora(`Up´ tests for suite run ${runId}`).start();
  try {
    if (!Array.isArray(resultLabel)) {
      resultLabel = [];
    }
    resultLabel.push('RootCause');
    const { testimFormat } = await api.executionsApi.createExecution(
      path,
      {
        projectId: credentials.projectId,
        resultLabels: resultLabel,
        // TODO(Benji) discuss with Elad, companyId is only used for
        // the testConfig and is probably not important?
        companyId: '',
      },
      (progress: number) => {
        const text = `${(progress * 100).toFixed(2)}%`;
        spinner.text = `Uploading tests for suite run ${runId} (${text})`;
      }
    );
    spinner.succeed('Execution Created Successfully');
    try {
      if (jUnitReportPath) {
        await saveJunitReport({
          jUnitReportPath,
          testimExecution: testimFormat,
          projectId: credentials.projectId,
        });
        console.log('Report file saved at ', jUnitReportPath);
      }
    } catch (e) {
      console.error('Error generating jUnit Report', e);
    }
    spinner.succeed(
      `Watch your tests in https://app.testim.io/#/project/${credentials.projectId}/runs/suites/${testimFormat.runId}`
    );
  } catch (e) {
    spinner.fail(`Error Creating Execution: ${e && e.message}`);
    console.error(e);
  }
}

async function saveJunitReport({
  jUnitReportPath,
  testimExecution,
  projectId,
}: {
  jUnitReportPath: string;
  testimExecution: TestimBackendExecutionInputFormat;
  projectId: string;
}) {
  const report = generateJunitReport({ testimExecution, projectId });
  await fs.writeFile(jUnitReportPath, report);
}

export function generateJunitReport({
  testimExecution,
  projectId,
}: {
  testimExecution: TestimBackendExecutionFormatSubsetForReporting;
  projectId: string;
}): string {
  const actualTests = Object.values(testimExecution.execution).filter(
    (test) => !test.isTestsContainer
  );
  const dateValue = new Date(testimExecution.startTime).toUTCString();
  const files = Object.values(testimExecution.execution).filter((test) => test.isTestsContainer);
  const baseUrl = `https://app.testim.io/#/project/${projectId}/branch/master/root-cause/run/${testimExecution.runId}`;
  const attr = (str: string) =>
    `"${str.replace(/"/g, '&quot').replace(/&/g, '&amp').replace(/</, '&lt;')}"`;
  // Includes the right values (from) https://llg.cubic.org/docs/junit/ with the battle tested ones (our cli jUnitReporter)
  const report = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><testsuites disabled='0'>${files
    .map((file) => {
      const tests = actualTests.filter((x) => x.parentResultId === file.resultId);
      const failed = tests.filter((x) => !x.success);
      return `\t<testsuite name=${attr(file.name)} tests="${tests.length}" failure="${
        failed.length
      }" failures="${failed.length}" timestamp="${dateValue}">
                 ${tests
                   .map(
                     (test) =>
                       `<testcase name=${attr(
                         test.name
                       )} classname="rootcause.test"><system-out>${baseUrl}/test/${
                         test.testId
                       }</system-out></testcase>`
                   )
                   .join('\n\t\t\t\t')}
             </testsuite>`;
    })
    .join('\n\t\t\t')}
         <system-out>Suite Run URL: ${baseUrl}</system-out>
    </testsuites>`;

  // const report = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  // <testsuites>
  //   <testsuite name="playground TES-6699-demo:playground with config '1280x800'" tests="8" failure="0" timestamp="2020-07-17T12:20:08.810Z">
  //     <testcase name="playground - validate generated playwright code on record" classname="testim.io.test" time="27.812">
  //       <system-out>https://app.testim.io/#/project/Testim-UI_f93f4936-f415-460a-b9a8-0c2ac81e7309/branch/master/test/LN05PyoNg8?result-id=kbePYrZuNZ</system-out>
  //     </testcase>
  //     <testcase name="playground - validate record and play buttons text change and functionality" classname="testim.io.test" time="22.414">
  //       <system-out>https://app.testim.io/#/project/Testim-UI_f93f4936-f415-460a-b9a8-0c2ac81e7309/branch/master/test/g5tZB7pIal?result-id=LunODjZShG</system-out>
  //     </testcase>
  //     <testcase name="playground - validate successful playback in the playground editor" classname="testim.io.test" time="36.369">
  //       <system-out>https://app.testim.io/#/project/Testim-UI_f93f4936-f415-460a-b9a8-0c2ac81e7309/branch/master/test/exGG3hJZ3U?result-id=SmpWvHUaVb</system-out>
  //     </testcase>
  //     <testcase name="playground - validate playwright code updates when updating codeless editor" classname="testim.io.test" time="38.016">
  //       <system-out>https://app.testim.io/#/project/Testim-UI_f93f4936-f415-460a-b9a8-0c2ac81e7309/branch/master/test/oharvsUAd3?result-id=cr8UXd1IUk</system-out>
  //     </testcase>
  //     <testcase name="playground - validate that red recording banner is shown when recording and hidden when stopping record" classname="testim.io.test" time="19.697">
  //       <system-out>https://app.testim.io/#/project/Testim-UI_f93f4936-f415-460a-b9a8-0c2ac81e7309/branch/master/test/EHLWRqG7Cv?result-id=DsR8blgaHt</system-out>
  //     </testcase>
  //     <testcase name="playground - validate that steps are being recorded in the codeless editor" classname="testim.io.test" time="24.006">
  //       <system-out>https://app.testim.io/#/project/Testim-UI_f93f4936-f415-460a-b9a8-0c2ac81e7309/branch/master/test/fNCHJoNETT?result-id=7f4yC3okpX</system-out>
  //     </testcase>
  //     <testcase name="playground - validated that editing a target element in the codeless editor updates the selector in playwright" classname="testim.io.test" time="31.326">
  //       <system-out>https://app.testim.io/#/project/Testim-UI_f93f4936-f415-460a-b9a8-0c2ac81e7309/branch/master/test/Jiim2YdpFQ?result-id=acza9OnipN</system-out>
  //     </testcase>
  //     <testcase name="playground - validate images are being uploaded successfully from blob" classname="testim.io.test" time="49.895">
  //       <system-out>https://app.testim.io/#/project/Testim-UI_f93f4936-f415-460a-b9a8-0c2ac81e7309/branch/master/test/Kgx42VhQ2Q?result-id=vSdlNR4yg1</system-out>
  //     </testcase>
  //   </testsuite>
  // </testsuites>`;
  return report;
}
