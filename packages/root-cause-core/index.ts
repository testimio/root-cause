export { launch } from './lib/launch';
export { attach } from './lib/index';
export type {
  EndTestFunction,
  AttachParams,
  AttachReturn,
  StartTestParams,
  AssertionReport,
} from './lib/attachInterfaces';
export type { RootCausePage } from './lib/interfaces';
export { updateHistoryFromRootCauseResultsOnly } from './lib/updateHistoryFromRootCauseResultsOnly';

// todo: figure out packages and code sharing
// These ones should also be splited to other packages
export * as utils from './lib/utils';
export * as CONSTS from './lib/consts';
export * as runConclusionUtils from './lib/runConclusion/runConclusionUtils';
export * as runConclusionInterfaces from './lib/runConclusion/interfaces';
export { persist } from './lib/persist';
export { guid as utilGuid } from './lib/testim-services-api/guid';
export { loadSettings } from './lib/userSettings/userSettings';
