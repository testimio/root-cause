import { extractPuppeteerText } from './puppeteer-text-mapping';
import { strictEqual } from 'assert';
import { Keyboard, Mouse, Page } from './common-for-tests';

describe('Selector extraction from puppeteer', () => {
  it('does not extract text from click', () => {
    strictEqual(extractPuppeteerText(Mouse, 'click', [1, 2], undefined), `[1,2]`);
  });
  it('extracts text from page type', () => {
    strictEqual(extractPuppeteerText(Page, 'type', ['.foo', 'hello'], 'bar'), 'hello');
  });
  it('extracts text from keyboard type', () => {
    strictEqual(extractPuppeteerText(Keyboard, 'type', ['hello'], 'bar'), 'hello');
  });
  it('extracts text from evaluate calls', () => {
    strictEqual(extractPuppeteerText(Page, 'evaluate', ['foo'], 'bar'), 'bar');
  });
});
