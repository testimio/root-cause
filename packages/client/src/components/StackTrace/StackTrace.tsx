import * as React from "react";
import type { StepResult } from "@testim/root-cause-types";
import classnames from "classnames";
import styles from './styles.module.css';

export const StackTrace = React.memo(function StackTrace({ step }: { step: StepResult }) {

    if (!step.stepCodeLocation) return <div></div>;

    const indentation = 6;

    return (
        <div className={styles.infoTab}>
            <div className={styles.errorMessage}>{step.stepError?.message}</div>
            <div className={styles.theCode}>
                {step.stepCodeLocation.codeLines.map((l, idx) => {
                    if (!step.stepCodeLocation) {
                        return null;
                    }

                    return (
                        <div key={idx}>
                            <div
                                className={classnames({ [styles.selected]: step.stepCodeLocation.fromRowNumber + idx === step.stepCodeLocation.row })} >
                                <span className={styles.cursors}>{step.stepCodeLocation.fromRowNumber + idx === step.stepCodeLocation.row ? '> ' : '  '}</span>
                                <span className={styles.lineNumbers}>{(step.stepCodeLocation.fromRowNumber + idx).toString()} |</span>
                                {l}
                            </div>
                            {step.stepCodeLocation.fromRowNumber + idx === step.stepCodeLocation.row && <div className={styles.cursors}>
                                {'\u00A0'.repeat(step.stepCodeLocation.column + indentation - 1)}^
                    </div>}
                        </div>

                    );
                })}
            </div>
            <div className={styles.stackTraceArea}>
                {step.stepError?.stack && <div className={styles.stackTrace}>
                    {step.stepError.stack.split('\n').slice(1).map((l, idx) => (
                        <div key={idx}>{l}</div>
                    ))}
                </div>}
                {!step.stepError?.stack && step.stepCodeLocation && <div className={styles.stackTrace}>
                    <div>{step.stepCodeLocation.sourceFileRelativePath}:{step.stepCodeLocation.row}:{step.stepCodeLocation.column}</div>
                </div>}
            </div>
        </div>
    );
});
