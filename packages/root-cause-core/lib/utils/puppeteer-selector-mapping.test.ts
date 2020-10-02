import { extractPuppeteerSelector } from './puppeteer-selector-mapping';
import { strictEqual } from 'assert';
import { ElementHandle, Keyboard, Page } from './common-for-tests';

describe('Selector extraction from puppeteer', () => {
  it('extracts selectors from click', () => {
    strictEqual(extractPuppeteerSelector(Page, 'click', ['foo']), 'foo');
  });
  it('extracts selectors from tap', () => {
    strictEqual(extractPuppeteerSelector(ElementHandle, 'tap', ['foo']), 'foo');
  });
  it('does not extract selectors from goto', () => {
    strictEqual(extractPuppeteerSelector(Page, 'goto', ['foo']), undefined);
  });
  it("should extract 'type' selector from page", () => {
    strictEqual(extractPuppeteerSelector(Page, 'type', ['foo']), 'foo');
  });
  it("should not extract 'type' selector from keyboard", () => {
    strictEqual(extractPuppeteerSelector(Keyboard, 'type', ['foo']), undefined);
  });
});
