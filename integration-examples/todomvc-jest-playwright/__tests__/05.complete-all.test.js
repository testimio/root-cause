const { sendSpecialCharacter, navigateToBaseUrl, addBasicBaseTodos } = require("../helpers");

it("Should mark all todo items as completed and then as uncompleted", async function () {
  await navigateToBaseUrl(page);

  await addBasicBaseTodos(page);

  const allItems = await page.$$(".todo-list li");
  expect(allItems).toHaveLength(4);

  await page.click("[for='toggle-all']");

  const allCompletedItems = await page.$$(".todo-list li.completed");
  expect(allCompletedItems).toHaveLength(4);

  await page.click("[for='toggle-all']");

  const allNotCompletedItems = await page.$$(".todo-list li:not(.completed)");
  expect(allNotCompletedItems).toHaveLength(4);
}, 30000);
