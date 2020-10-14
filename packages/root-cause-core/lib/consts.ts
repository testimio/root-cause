export const CONFIG_MODULE_NAME = 'root-cause';
export const RESULTS_DIR_NAME = '.root-cause';
export const RUNS_DIR_NAME = 'runs';
export const TEST_RESULTS_FILE_NAME = 'results.json';
export const RUN_CONCLUSION_FILE_NAME = 'runConclusion.json';
export const FALLBACK_RUN_ID = 'no_run_id';
export const HISTORY_FILE_NAME = 'history.json';
export const HISTORY_RUNS_TO_RETAIN = 5;

export const NODE_VERSION = parseFloat(process.versions.node);

export const IS_NODE_10 = NODE_VERSION < 12 && NODE_VERSION > 9;
export const RUN_ID_ENV_VAR = 'ROOT_CAUSE_RUN_ID';
