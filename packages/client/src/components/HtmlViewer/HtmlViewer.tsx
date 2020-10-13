import { StepResult } from '@testim/root-cause-types';
import React from 'react';
import { apiUrl } from '../../stores/MainStore';
import styles from './styles.module.scss';

export interface HtmlViewerProps {
  className?: string;
  step: StepResult;
}

export function HtmlViewer({ step: { mhtmlFile }, className: containerClass }: HtmlViewerProps) {
  if (!mhtmlFile) {
    // TODO: provide nicer image, like in logs file
    return <div>No HTML Recorded</div>;
  }

  return (
    <div className={containerClass}>
      <div className={styles.innerContainer}>
        <iframe title={mhtmlFile} src={`${apiUrl}/test/html/${mhtmlFile}`} />
      </div>
    </div>
  );
}
