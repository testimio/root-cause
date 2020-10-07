import * as React from 'react';
import type { StepResult } from '@testim/root-cause-types';
import { useState, useRef, useLayoutEffect } from 'react';
import styles from './styles.module.css';
import classnames from 'classnames';
import type { Har } from 'har-format';
import stripAnsi from 'strip-ansi';

export type StepResultTab = 'screenshots' | 'html' | 'stacktrace' | 'logs' | 'network';

function Tab({
  tabName,
  selectedTab,
  selectTab,
}: {
  selectedTab: string;
  tabName: StepResultTab;
  selectTab(tab: StepResultTab): void;
}) {
  return (
    <div
      className={classnames({ [styles.selected]: selectedTab === tabName })}
      onClick={() => selectTab(tabName)}
    >
      <div>
        {tabName.toUpperCase()}
        <div className={styles.underline}></div>
      </div>
    </div>
  );
}

const SIMPLE_TABS: StepResultTab[] = ['screenshots', 'html', 'stacktrace', 'logs'];

export const StepResultTitlebar = function StepResultTitlebar({
  selectedStep,
  selectedTab,
  selectTab,
  harFileContents,
  isClickimMode,
}: {
  selectedStep: StepResult;
  selectedTab: StepResultTab;
  selectTab(tab: StepResultTab): void;
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
  }, [setToolTipNeeded, selectedStep]);

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
        {SIMPLE_TABS.map((tabName) => (
          <Tab {...{ key: tabName, tabName, selectedTab, selectTab }} />
        ))}
        {harFileContents && <Tab {...{ tabName: 'network', selectedTab, selectTab }} />}
      </div>
    </div>
  );
};
