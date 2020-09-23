import * as React from 'react';
import type { StepResult } from '@testim/root-cause-types';
import styles from './styles.module.css';
import classnames from 'classnames';
import { apiUrl, useMainStore } from '../../stores/MainStore';
import { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Screenshot } from '../Screenshots/Screenshots';
import stripAnsi from 'strip-ansi';

export const StepsSidebar = observer(() => {
  const mainStore = useMainStore();

  const { steps, selectedStep, selectedStepIndex, setSelectedStep } = mainStore;

  const sideBarRef = useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const selectedElement = sideBarRef.current?.children[selectedStepIndex];
    if (selectedElement && selectedElement instanceof HTMLElement) {
      // Non-standard, works in chrome
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
      // @ts-expect-error
      selectedElement.scrollIntoViewIfNeeded(false);
    }
  }, [selectedStepIndex]);

  return (
    <div id="sidebar" className={styles.sideBar} ref={sideBarRef}>
      {steps.map((step, i) => (
        <div
          className={classnames(styles.stepItem, {
            [styles.selected]: step === selectedStep,
            [styles.stepFailed]: 'stepError' in step,
          })}
          key={i}
          onClick={() => setSelectedStep(i)}
        >
          <div className={styles.border}></div>
          <div className={styles.contents}>
            {step.screenshot ? (
              <Screenshot
                step={step}
                apiUrl={apiUrl}
                className={styles.thumbnailContainer}
                imageStretchBehavior="zoom"
              />
            ) : (
              calculateText(step)
            )}
          </div>
          <div className={styles.stepIcon}>
            <div className={getIcon(step)}></div>
          </div>
          <div className={styles.title}>
            <span>{step.name ? stripAnsi(step.name) : undefined}</span>
          </div>
        </div>
      ))}
    </div>
  );
});

export function calculateText(step: StepResult) {
  if (step.rect) {
    // if the step had a rectangle it had a screenshot in which case it shouldn't display text (currently)
    return '';
  }

  if (step.text) {
    return step.text;
  }

  return '';
}

const icons = {
  keyboard: styles.keyboardIconSvg,
  click: styles.clickIconSvg,
  arrow: styles.arrowIconSvg,
  chrome: styles.chromeIconSvg,
  assertion: styles.assertionIconSvg,
} as const;

function getIcon(step: StepResult): string {
  switch (step.fnName) {
    case 'addScriptTag':
      return icons.chrome;
    case 'addStyleTag':
      return icons.chrome;
    case 'authenticate':
      return icons.chrome;
    case 'bringToFront':
      return icons.chrome;
    case 'click':
      return icons.click;
    case 'hover':
      return icons.click;
    case 'close':
      return icons.chrome;
    case 'tap':
      return icons.click;
    case 'type':
      return icons.keyboard;
    case 'assertion':
      return icons.assertion;
    default:
      return icons.chrome;
  }
}
