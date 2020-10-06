const {
  navigateToBaseUrl,
  addBasicBaseTodos,
  expectHaveClass,
  expectNotHaveClass,
} = require("../helpers");

it("Clear button should delete completed todos", async function () {
  await navigateToBaseUrl(page);
  await addBasicBaseTodos(page);

  const todoItem = await page.waitForSelector("ul.todo-list > li:nth-child(3)");
  await page.click("ul.todo-list > li:nth-child(3) input[type=checkbox]");

  await page.click("button.clear-completed");

  await expect(todoItem.boundingBox()).resolves.toBeNull();
}, 300_000);
