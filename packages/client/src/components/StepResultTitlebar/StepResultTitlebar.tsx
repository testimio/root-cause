import * as React from 'react';
import type { StepResult } from '@testim/root-cause-types';
import { useState, useRef, useLayoutEffect } from 'react';
import styles from './styles.module.css';
import classnames from 'classnames';
import type { Har } from 'har-format';
import stripAnsi from 'strip-ansi';

export const StepResultTitlebar = function StepResultTitlebar({
  selectedStep,
  selectedTab,
  selectTab,
  harFileContents,
  isClickimMode,
}: {
  selectedStep: StepResult;
  selectedTab: 'screenshots' | 'stacktrace' | 'logs' | 'network';
  selectTab(tab: 'screenshots' | 'stacktrace' | 'logs' | 'network'): unknown;
  harFileContents: Har | undefined;
  isClickimMode: boolean;
}) {
  const [hover, setHover] = useState<boolean>(false);
  const [toolTipNeeded, setToolTipNeeded] = useState<boolean>(false);
  const stepNameRef = useRef<HTMLSpanElement>(null);
  const stepErrorStr = selectedStep.stepError?.message
    ? stripAnsi(selectedStep.stepError?.message).substr(0, 100)
    : undefined;
  const stepName = selectedStep.name ? stripAnsi(selectedStep.name) : undefined;

  useLayoutEffect(() => {
    function handleResize() {
      if (stepNameRef.current) {
        setToolTipNeeded(stepNameRef.current.offsetWidth !== stepNameRef.current.scrollWidth);
      }
    }
    handleResize();

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [toolTipNeeded, selectedStep]);

  return (
    <div
      className={classnames(styles.stepTitleBar, {
        [styles.isClickimMode]: isClickimMode,
      })}
    >
      <div className={styles.stepTitle}>
        <span
          ref={stepNameRef}
          className={styles.stepName}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {stepName}
        </span>
        {hover && toolTipNeeded && <div className={styles.tooltip}>{selectedStep.name}</div>}
        <span className={styles.stepError}>{stepErrorStr}</span>
      </div>
      <div className={styles.tabs}>
        <div
          className={classnames({ [styles.selected]: selectedTab === 'screenshots' })}
          onClick={() => {
            selectTab('screenshots');
          }}
        >
          <div>
            SCREENSHOT
            <div className={styles.underline}></div>
          </div>
        </div>
        <div
          className={classnames({ [styles.selected]: selectedTab === 'stacktrace' })}
          onClick={() => {
            selectTab('stacktrace');
          }}
        >
          <div>
            STACKTRACE
            <div className={styles.underline}></div>
          </div>
        </div>
        <div
          className={classnames({ [styles.selected]: selectedTab === 'logs' })}
          onClick={() => {
            selectTab('logs');
          }}
        >
          <div>
            LOGS
            <div className={styles.underline}></div>
          </div>
        </div>
        {harFileContents && (
          <div
            className={classnames({ [styles.selected]: selectedTab === 'network' })}
            onClick={() => {
              selectTab('network');
            }}
          >
            <div>
              NETWORK
              <div className={styles.underline}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
