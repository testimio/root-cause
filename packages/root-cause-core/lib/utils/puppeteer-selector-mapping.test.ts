import { extractPuppeteerSelector } from './puppeteer-selector-mapping';
import { strictEqual } from 'assert';

describe('Selector extraction from puppeteer', () => {
  it('extracts selectors from click', () => {
    strictEqual(extractPuppeteerSelector('click', ['foo']), 'foo');
  });
  it('extracts selectors from tap', () => {
    strictEqual(extractPuppeteerSelector('tap', ['foo']), 'foo');
  });
  it('does not extract selectors from goto', () => {
    strictEqual(extractPuppeteerSelector('goto', ['foo']), undefined);
  });
});
