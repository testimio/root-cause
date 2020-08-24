import { observable, action, computed } from "mobx";
import { fromPromise } from "mobx-utils";
import { createContext, useContext } from "react";
import type { StepResult, TestResultFile } from "@testim/root-cause-types";
import type { Har } from "har-format";

let apiUrl = process.env.REACT_APP_SERVER_PROXY ? window.location.origin : 'http://localhost:9876';

if (window.location.href.includes("gitpod.io")) {
    apiUrl = window.location.origin;
}

const MainStoreContext = createContext<MainStore>(undefined as any);


export { apiUrl, MainStoreContext };

export function useMainStore() {
    return useContext(MainStoreContext);
}

type ScreenplayStepResult = StepResult;
interface ILoadTestResult {
    (): Promise<any>;
};
export class MainStore {

    constructor(
        private loadTestResultExternal: ILoadTestResult | null,
        private externalResourceUrl: (resource: string |undefined) => undefined | string
    ) {
    }

    @computed get steps(): ScreenplayStepResult[] {
        if (this.resultsFile) {
            return this.resultsFile.steps;
        }

        return [];
    }

    @computed get resultsFile(): TestResultFile | undefined {
        const p = fromPromise(this.resultsFileRequest);

        if (p.state === "fulfilled") {
            return p.value;
        }

        return undefined;
    }

    @computed get harFile(): Har | undefined {
        const maybePromise = this.harFileRequest;
        if (maybePromise === undefined) {
            return undefined;
        }

        const p = fromPromise(maybePromise);

        if (p.state === "fulfilled") {
            return p.value;
        }

        return undefined;
    }

    @computed get testTotalTime(): number {
        if (!this.resultsFile) {
            return 0;
        } else {
            const first = this.resultsFile.steps[0];
            const last = this.resultsFile.steps[this.resultsFile.steps.length - 1];

            return last.startTimestamp - first.startTimestamp;
        }
    }

    @computed private get resultsFileRequest() {
        if (this.loadTestResultExternal) {
            return this.loadTestResultExternal();
        }
        return getResultsFile();
    }

    @computed private get harFileRequest(): Promise<Har> | undefined {
        if (this.resultsFile?.metadata.hasNetworkLogs) {
            const resource = this.externalResourceUrl('networkLogs.har');

            if (resource) {
                return fetch(resource).then(b => b.json());
            }
        }

        return undefined;
    }

    @observable
    private _selectedStepIndex: undefined | number;

    @computed public get selectedStepIndex() {
        if (this._selectedStepIndex !== undefined) {
            return this._selectedStepIndex;
        }

        const stepWithError = this.steps.findIndex(s => s.stepError !== undefined);

        if (stepWithError) {
            return stepWithError;
        }

        return 0;
    }

    @computed get selectedStep(): StepResult | undefined {
        return this.steps[this.selectedStepIndex];
    }

    @action.bound
    setSelectedStep(index: number) {
        this._selectedStepIndex = index;
    }

    @action.bound
    goToPreviousStep() {
        let newStepIndex = this.selectedStepIndex;
        newStepIndex --;
        if (newStepIndex < 0) newStepIndex = 0;
        this._selectedStepIndex = newStepIndex;

    }

    @action.bound
    goToNextStep() {
        let newStepIndex = this.selectedStepIndex;
        newStepIndex ++;
        if (newStepIndex === this.steps.length) newStepIndex --;
        this._selectedStepIndex = newStepIndex;

    }

    @action.bound
    handleKeypress(keyCode: number) {
        if (keyCode === 37 || keyCode === 38) {
            this.goToPreviousStep();
        } else if (keyCode === 39 || keyCode === 40) {
            this.goToNextStep();
        }
    }
}

async function getResultsFile() {

    // const urlParams = new URLSearchParams(window.location.search);
    // const testName = urlParams.get('test');
    const url = `${apiUrl}/test/`;
    const result = await fetch(url);
    const items = await result.json();

    return items;
}
