import * as React from "react";
import type { StepResult } from "@testim/root-cause-types";
import { useState, useRef, useLayoutEffect, useMemo, useEffect } from "react";
import styles from './styles.module.css';
import classnames from "classnames";
import type { Har } from "har-format";
import downloadHarButton from "./../../globalAssets/archive.svg";
import { harInTimeRange } from "../../utils/harEntriesInTimeRange";

export const StepResultTitlebar = function StepResultTitlebar({
    selectedStep,
    selectedTab,
    selectTab,
    harFileContents,
    isClickimMode
}: {
    selectedStep: StepResult;
    selectedTab: "screenshots" | "stacktrace" | "logs" | "network";
    selectTab(tab: "screenshots" | "stacktrace" | "logs" | "network"): unknown;
    harFileContents: Har | undefined;
    isClickimMode: boolean
}) {
    const [ hover, setHover ]  = useState<boolean>(false);
    const [ toolTipNeeded, setToolTipNeeded ]  = useState<boolean>(false);
    const stepNameRef = useRef<HTMLSpanElement>(null);
    const [harFileObjectUrl, setHarFileObjectUrl] = React.useState<string>();

    const harFileJSONForStep = useMemo(() => {
        if (harFileContents === undefined || selectedStep.endTimestamp === undefined || selectedStep.startTimestamp === undefined) {
            return;
        }

        const stepStartTime = new Date(selectedStep.startTimestamp);
        const stepEndTime = new Date(selectedStep.endTimestamp);

        return harInTimeRange(harFileContents, stepStartTime, stepEndTime);

    }, [harFileContents, selectedStep.endTimestamp, selectedStep.startTimestamp]);

    useEffect(() => {
        if (harFileJSONForStep === undefined) {
            return;
        }

        const blob = new Blob([JSON.stringify(harFileJSONForStep, null, 2)], {type : 'application/json'});
        const objectUrl = window.URL.createObjectURL(blob);
        setHarFileObjectUrl(objectUrl);

        return function cleanup() {
            window.URL.revokeObjectURL(objectUrl);
        }
    }, [harFileJSONForStep])

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
        <div className={classnames(styles.stepTitleBar, {
            [styles.isClickimMode]: isClickimMode
        })}>
            <div className={styles.stepTitle}>
                <span ref={stepNameRef} className={styles.stepName} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} >
                 {selectedStep.name}
                </span>
                { (hover && toolTipNeeded) && <div className={styles.tooltip} >{ selectedStep.name }</div> }
                <span className={styles.stepError}>{selectedStep.stepError?.message.substr(0, 50)}</span>
            </div>
            <div className={styles.tabs}>
                {harFileObjectUrl && <div className={styles.downloadHar}>
                    <a href={harFileObjectUrl} download="step-har-file.har">
                    <div>
                    <img src={downloadHarButton} alt="download har" />
                        DOWNLOAD HAR FOR STEP
                        <div className={styles.underline}></div>
                    </div>
                    </a>
                </div>}
                <div
                    className={classnames({ [styles.selected]: selectedTab === "screenshots" })}
                    onClick={() => { selectTab("screenshots"); }} >
                    <div>SCREENSHOT
                        <div className={styles.underline}></div>
                    </div>

                </div>
                <div
                    className={classnames({ [styles.selected]: selectedTab === "stacktrace" })}
                    onClick={() => { selectTab("stacktrace"); }} >
                    <div>STACKTRACE
                        <div className={styles.underline}></div>
                    </div>
                </div>
                <div
                    className={classnames({ [styles.selected]: selectedTab === "logs" })}
                    onClick={() => { selectTab("logs"); }} >
                    <div>LOGS
                        <div className={styles.underline}></div>
                    </div>
                </div>
                {harFileContents && <div
                    className={classnames({ [styles.selected]: selectedTab === "network" })}
                    onClick={() => { selectTab("network"); }} >
                    <div>NETWORK
                        <div className={styles.underline}></div>
                    </div>
                </div>}
            </div>
        </div>
    );
};
