import * as React from "react";
import type { StepResult } from "@testim/root-cause-types";
import classnames from "classnames";
import styles from './styles.module.css';

export const StackTrace = function StepResultTitlebar({ step }: { step: StepResult }) {

    if (!step.codeError) return <div></div>;

    const identation = 6;

    return (
        <div className={styles.infoTab}>
            { step.stepError?.message } <br /><br />

            <div className={styles.theCode}>
            { step.codeError.errorLines.map((l, idx) => (
                <div key={idx}>
                    <div
                    className={classnames({ [styles.selected]: step.codeError!.fromRowNumber + idx === step.codeError!.row })} >
                        <span className={styles.cursors}>{ step.codeError!.fromRowNumber + idx === step.codeError!.row ? '> ' : '  '}</span>

                        <span className={styles.lineNumbers}>{(step.codeError!.fromRowNumber + idx).toString()} |</span>
                        { l }
                    </div>
                    { step.codeError!.fromRowNumber + idx === step.codeError!.row && <div className={styles.cursors}>
                        {'\u00A0'.repeat(step.codeError!.column + identation - 1)}^
                    </div> }
                </div>

            ))}
            </div>
<br /><br />

            <div className={styles.stackTrace}>
                { step.stepError?.stack?.split('\n').slice(1).map((l, idx) =>(
                    <div key={idx}>{ l }</div>
                )) }
            </div>
        </div>
    );
};
