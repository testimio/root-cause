import { extractPuppeteerText } from './puppeteer-text-mapping';
import { strictEqual } from 'assert';

describe('Selector extraction from puppeteer', () => {
  it('does not extract text from click', () => {
    strictEqual(extractPuppeteerText('click', ['foo'], undefined), undefined);
  });
  it('extracts text from type', () => {
    strictEqual(extractPuppeteerText('type', ['.foo', 'hello'], 'bar'), 'hello');
  });
  it('extracts text from evaluate calls', () => {
    strictEqual(extractPuppeteerText('evaluate', ['foo'], 'bar'), 'bar');
  });
});
