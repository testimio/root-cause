import React from 'react';
import styles from './styles.module.scss';
// @ts-ignore
import { NetworkViewer as ExternalNetworkViewer } from 'network-viewer';
import { harInTimeRange } from '../../utils/harEntriesInTimeRange';
import type { Har } from 'har-format';
import type { StepResult } from '@testim/root-cause-types';

export const NetworkViewer = React.memo(function NetworkViewer({
  harFile,
  selectedStep,
}: {
  harFile: Har;
  selectedStep: StepResult;
}) {
  if (selectedStep.endTimestamp === undefined || selectedStep.startTimestamp === undefined) {
    return null;
  }

  const stepStartTime = new Date(selectedStep.startTimestamp);
  const stepEndTime = new Date(selectedStep.endTimestamp);

  return (
    <div className={styles.container}>
      <ExternalNetworkViewer
        // solves warnings from inside ExternalNetworkViewer
        key={selectedStep.index}
        containerClassName={styles.externalViewerContainer}
        data={harInTimeRange(harFile, stepStartTime, stepEndTime)}
        options={{
          showImportHAR: false,
          showTimeline: false,
        }}
      />
    </div>
  );
});
