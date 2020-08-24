import * as React from "react";
import styles from "./styles.module.css";
import type { TestSystemInfo, TestResultFile } from "@testim/root-cause-types";
import classnames from "classnames";
import ms from 'ms';
import downloadHarButton from "./../../globalAssets/archive.svg";
import { useExternalResourceUrl } from "../../stores/ExternalResourceUrlContext";

export const TestResultTitlebar = React.memo(function TestResultTitlebar({ testMetadata, totalTime, isClickimMode }: { testMetadata: TestResultFile["metadata"], totalTime:number, isClickimMode:boolean }) {
    const testStatus: "success" | "failed" | "unknown" = testMetadata.testEndStatus ? testMetadata.testEndStatus.success ? "success" : "failed" : "unknown"
    const getExternalResourceUrl = useExternalResourceUrl();

    return (
        <div className={styles.titleBar}>
            <div className={styles.logo}>
                { !isClickimMode && (
                    <>
                    <div className={styles.logoSvg} />
                    <span className={styles.logoText}>Root Cause</span>
                    </>
                ) }
                <span className={classnames(styles.testName, { [styles.clickimTitle]:isClickimMode })} title={testMetadata.testFullName}>{testMetadata.testName}</span>
            </div>
            <div className={styles.testStatus}>
                {testMetadata.hasNetworkLogs && <a className={styles.downloadHar} role="button" href={getExternalResourceUrl('networklogs.har')} download="har.json"><img src={downloadHarButton} alt="Download HAR file" />Download HAR</a>}
                {testStatus === "success" && <div className={styles.success}>TEST PASSED</div>}
                {testStatus === "failed" && <div className={styles.fail}>TEST FAILED</div>}
                <div className={classnames(styles.info, {
                    [styles.failed]: testStatus === "failed"
                })}>
                    <div className={styles.whiteBackground}></div>
                    <div className={styles.tooltipErrorSvg}></div>
                    <div className={styles.popup}>
                        <div className={styles.triangle}></div>
                        {
                            testMetadata.systemInfo && <TestInfoPopupFields fields={mapTestSystemDataToTestFields(testMetadata.systemInfo)} totalTime={totalTime} />
                        }
                    </div>
                </div>
            </div>
        </div>
    );
});

function TestInfoPopupFields({ fields, totalTime }: { fields: Array<[string, string]>, totalTime: number }) {
    return (
        <div className={styles.fields}>
            <div className={styles.headField}>TEST FAILED - { ms(totalTime, { long: true}) }</div>
            {fields.map(([fieldName, fieldValue], i) => (
                <React.Fragment key={i}>
                    <span>{fieldName}</span>
                    <span>{fieldValue}</span>
                </React.Fragment>
            ))}
        </div>
    );
}

function mapTestSystemDataToTestFields(systemData: TestSystemInfo) {
    const fields: Array<[string, string]> = [];

    fields.push(["Browser Platform",  systemData.browserPlatform]);
    fields.push(["Browser Version",  systemData.browserVersion]);
    fields.push(["User Agent",  systemData.userAgent]);
    fields.push(["Machine Model Name",  systemData.modelName]);
    fields.push(["Machine Model Version",  systemData.modelVersion]);
    fields.push(["Viewport", `${systemData.pageViewport.width}x${systemData.pageViewport.height}`]);
    fields.push(["Scale Factor", `${systemData.pageViewport.deviceScaleFactor || 1}`]);
    fields.push(["Mobile", `${systemData.pageViewport.isMobile ? "yes": "no"}`]);
    fields.push(["Landscape", `${systemData.pageViewport.isLandscape ? "yes": "no"}`]);
    fields.push(["Touch Support", `${systemData.pageViewport.hasTouch ? "yes": "no"}`]);

    return fields;
}
