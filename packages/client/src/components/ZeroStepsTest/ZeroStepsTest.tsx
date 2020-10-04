import * as React from 'react';
import styles from './styles.module.css';
import noImagePlaceholder from './no_image@3x.svg';

export function ZeroStepsTest() {
  return (
    <div className={styles.emptyStateWrapper}>
      <img src={noImagePlaceholder} alt="Test have zero detected steps" />
      <h3>No test steps detected</h3>
      <h3>
        The selected test might have no browser automation calls, or there's a problem with the
        integration
      </h3>
    </div>
  );
}
