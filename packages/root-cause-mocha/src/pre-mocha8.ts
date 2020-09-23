/**
 * This file should be loaded using mocha --file @testim/root-cause-mocha/pre-mocha8
 */
import { mochaHooks } from './rootHooks';

if (mochaHooks.beforeAll) {
  for (const func of ensureArrayWrap(mochaHooks.beforeAll)) {
    before(func);
  }
}

if (mochaHooks.beforeEach) {
  for (const func of ensureArrayWrap(mochaHooks.beforeEach)) {
    beforeEach(func);
  }
}

if (mochaHooks.afterAll) {
  for (const func of ensureArrayWrap(mochaHooks.afterAll)) {
    after(func);
  }
}

if (mochaHooks.afterEach) {
  for (const func of ensureArrayWrap(mochaHooks.afterEach)) {
    afterEach(func);
  }
}

function ensureArrayWrap<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}
