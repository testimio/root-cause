import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { apiUrl, MainStore, MainStoreContext } from './stores/MainStore';
import { GetExternalResourceUrlContext, defaultExternalResourceUrl } from './stores/ExternalResourceUrlContext';
import { Screenshot } from './components/Screenshots/Screenshots';
import { StackTrace } from './components/StackTrace/StackTrace';
import { Logs } from './components/Logs/Logs';
import { StepsSidebar } from './components/StepsSidebar/StepsSidebar';
import { TestResultTitlebar } from './components/TestResultTitlebar/TestResultTitlebar';
import { StepResultTitlebar } from './components/StepResultTitlebar/StepResultTitlebar';
import styles from './styles.module.css';
import type { TestResultFile } from '@testim/root-cause-types';
import { NetworkViewer } from './components/NetworkViewer/NetworkViewer';

interface AppComponentProps {
  loadTestResult?: null | (() => Promise<TestResultFile>);
  getResourceUrl?: (resource: string | undefined) => string | undefined;
  isClickimMode?: boolean;
}

const AppComponent = ({
  loadTestResult = null,
  getResourceUrl = defaultExternalResourceUrl,
  isClickimMode,
}: AppComponentProps) => {
  const mainStore = useMemo(() => {
    return new MainStore(loadTestResult, getResourceUrl);
  }, [getResourceUrl, loadTestResult]);

  const [selectedTab, selectTab] = React.useState<'screenshots' | 'stacktrace' | 'logs' | 'network'>('screenshots');

  const { selectedStep } = mainStore;

  const selectedTabJsx = React.useMemo(() => {
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
          apiUrl={apiUrl}
        />
      );
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
  }, [mainStore.harFile, selectedStep, selectedTab]);

  if (mainStore.resultsFile === undefined) {
    return <p className={styles.loader}></p>;
  }

  return (
    <GetExternalResourceUrlContext.Provider value={getResourceUrl}>
      <MainStoreContext.Provider value={mainStore}>
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
      </MainStoreContext.Provider>
    </GetExternalResourceUrlContext.Provider>
  );
};

const App = observer(AppComponent);
export default App;
