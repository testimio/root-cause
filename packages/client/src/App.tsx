import React, { useMemo } from 'react';
import { MainStore, MainStoreContext } from './stores/MainStore';
import {
  GetExternalResourceUrlContext,
  defaultExternalResourceUrl,
} from './stores/ExternalResourceUrlContext';
import type { TestResultFile } from '@testim/root-cause-types';
import { SingleTestResultPage } from './components/SingleTestResultPage/SingleTestResultPage';

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

  return (
    <GetExternalResourceUrlContext.Provider value={getResourceUrl}>
      <MainStoreContext.Provider value={mainStore}>
        <SingleTestResultPage mainStore={mainStore} isClickimMode={!!isClickimMode} />
      </MainStoreContext.Provider>
    </GetExternalResourceUrlContext.Provider>
  );
};

export default AppComponent;
