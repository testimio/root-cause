import { openServer } from './server';
import { TEST_API_PORT, INJECTED_TEST_DIR } from './envVarsWrapper';
import { assertNotNullOrUndefined } from './utils';

assertNotNullOrUndefined(INJECTED_TEST_DIR);

openServer(TEST_API_PORT, INJECTED_TEST_DIR);
