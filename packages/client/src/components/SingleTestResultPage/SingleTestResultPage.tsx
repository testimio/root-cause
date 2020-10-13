import React from 'react';
import { Screenshot } from '../Screenshots/Screenshots';
import { StackTrace } from '../StackTrace/StackTrace';
import { Logs } from '../Logs/Logs';
import { StepsSidebar } from '../StepsSidebar/StepsSidebar';
import { TestResultTitlebar } from '../TestResultTitlebar/TestResultTitlebar';
import { StepResultTab, StepResultTitlebar } from '../StepResultTitlebar/StepResultTitlebar';
import styles from './styles.module.css';
import { NetworkViewer } from '../NetworkViewer/NetworkViewer';
import type { MainStore } from '../../stores/MainStore';
import { ZeroStepsTest } from '../ZeroStepsTest/ZeroStepsTest';
import { observer } from 'mobx-react-lite';
import { HtmlViewer } from '../HtmlViewer/HtmlViewer';

export const SingleTestResultPage = observer(function SingleTestResultPage({
  mainStore,
  isClickimMode,
}: {
  mainStore: MainStore;
  isClickimMode: boolean;
}) {
  const [selectedTab, selectTab] = React.useState<StepResultTab>('screenshots');

  const { selectedStep } = mainStore;

  const selectedTabJsx = React.useMemo(() => {
    if (mainStore.steps.length === 0) {
      return <ZeroStepsTest />;
    }

    if (!selectedStep) {
      return null;
    }

    if (selectedTab === 'screenshots') {
      return (
        <Screenshot
          showHighlightRect={true}
          step={selectedStep}
          className={styles.screenshotContainer}
          screenshotClassName={styles.image}
        />
      );
    }

    if (selectedTab === 'html') {
      return <HtmlViewer step={selectedStep} className={styles.htmlContainer} />;
    }

    if (selectedTab === 'stacktrace') {
      return <StackTrace step={selectedStep} />;
    }

    if (selectedTab === 'logs') {
      return <Logs step={selectedStep} />;
    }

    if (selectedTab === 'network' && mainStore.harFile) {
      return <NetworkViewer selectedStep={selectedStep} harFile={mainStore.harFile} />;
    }
  }, [mainStore.harFile, mainStore.steps.length, selectedStep, selectedTab]);

  if (mainStore.resultsFile === undefined) {
    return <p className={styles.loader}></p>;
  }

  return (
    <div className={styles.app} onKeyDown={(e) => mainStore.handleKeypress(e.keyCode)} tabIndex={0}>
      {mainStore.resultsFile.metadata.systemInfo && (
        <TestResultTitlebar
          isClickimMode={!!isClickimMode}
          testMetadata={mainStore.resultsFile.metadata}
          totalTime={mainStore.testTotalTime}
        />
      )}
      <StepsSidebar />
      <div className={styles.layoutSelector}></div>
      {mainStore.selectedStep && (
        <StepResultTitlebar
          selectedStep={mainStore.selectedStep}
          isClickimMode={!!isClickimMode}
          selectedTab={selectedTab}
          selectTab={selectTab}
          harFileContents={mainStore.harFile}
          hasHtml={!!mainStore.selectedStep.mhtmlFile}
        />
      )}
      <div className={styles.stepContents}>
        <div className={styles.navButton} onClick={mainStore.goToPreviousStep}>
          <div className={styles.arrowIconSvg}></div>
        </div>
        <div className={styles.tabWrapper}>{selectedTabJsx}</div>
        <div className={styles.navButton} onClick={mainStore.goToNextStep}>
          <div className={styles.arrowIconSvg}></div>
        </div>
      </div>
    </div>
  );
});
