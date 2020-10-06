const { navigateToBaseUrl, addBasicBaseTodos } = require("../helpers");

it("Filter todos controls", async function () {
  await navigateToBaseUrl(page);

  await addBasicBaseTodos(page);

  // Complete one item
  await page.click(".todo-list > :nth-child(3) input[type=checkbox]");

  await page.click("[href='#/completed']");

  let allCompletedItems = await page.$$(".todo-list li.completed");
  expect(allCompletedItems).toHaveLength(1);

  let allNotCompletedItems = await page.$$(".todo-list li:not(.completed)");
  expect(allNotCompletedItems).toHaveLength(0);

  await page.click("[href='#/active']");

  allCompletedItems = await page.$$(".todo-list li.completed");
  expect(allCompletedItems).toHaveLength(0);

  allNotCompletedItems = await page.$$(".todo-list li:not(.completed)");
  expect(allNotCompletedItems).toHaveLength(3);

  await page.click("[href='#/']");

  allCompletedItems = await page.$$(".todo-list li.completed");
  expect(allCompletedItems).toHaveLength(1);

  allNotCompletedItems = await page.$$(".todo-list li:not(.completed)");
  expect(allNotCompletedItems).toHaveLength(3);
}, 10000);
