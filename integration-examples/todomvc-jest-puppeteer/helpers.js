// kill global page inside this file, so we will have to pass it as param
let page;

module.exports = {
  addBasicBaseTodos,
  getBaseUrl,
  sendSpecialCharacter,
  navigateToBaseUrl,
  expectHaveClass,
  expectNotHaveClass,
  sleep,
};

/**
 *
 * @param {import('puppeteer').Page} page
 * @param {string} selector
 * @param {string} expectedClass
 */
async function expectHaveClass(page, selector, expectedClass) {
  const el = await page.waitForSelector(selector);
  const classProp = await (await el.getProperty("className")).jsonValue();
  expect(classProp).toEqual(expect.stringContaining(expectedClass));
}

/**
 *
 * @param {import('puppeteer').Page} page
 * @param {string} selector
 * @param {string} unExpectedClass
 */
async function expectNotHaveClass(page, selector, unExpectedClass) {
  const el = await page.waitForSelector(selector);
  const classProp = await (await el.getProperty("className")).jsonValue();
  expect(classProp).toEqual(expect.not.stringContaining(unExpectedClass));
}

/**
 *
 * @param {import('puppeteer').Page} page
 */
async function navigateToBaseUrl(page) {
  await page.goto(getBaseUrl());
  // tiny, but needed to ensure page is loaded sometimes ¯\_(ツ)_/¯
  await sleep(100);
}

function getBaseUrl() {
  // return process.env.TEST_BASE_URL || "http://localhost:8080/react";
  return process.env.TEST_BASE_URL || "http://todomvc.com/examples/react";
}

/**
 *
 * @param {number} time
 */
function sleep(time) {
  return /** @type {Promise<void>} */ (new Promise((res) => {
    setTimeout(res, time);
  }));
}

/**
 *
 * @param {import('puppeteer').Page} page
 * @param {string} selector
 * @param {"Enter" | "Tab"} key
 */
async function sendSpecialCharacter(page, selector, key) {
  const elementHandle = await page.waitForSelector(selector);
  await elementHandle.press(key);
}

/**
 *
 * @param {import('puppeteer').Page} page
 */
async function addBasicBaseTodos(page) {
  await page.type(".new-todo", "Buy milk");
  await sendSpecialCharacter(page, ".new-todo", "Enter");

  await page.type(".new-todo", "Order Pizza");
  await sendSpecialCharacter(page, ".new-todo", "Enter");

  await page.type(".new-todo", "Wash the dishes");
  await sendSpecialCharacter(page, ".new-todo", "Enter");

  await page.type(".new-todo", "Talk to Ben");
  await sendSpecialCharacter(page, ".new-todo", "Enter");
}
