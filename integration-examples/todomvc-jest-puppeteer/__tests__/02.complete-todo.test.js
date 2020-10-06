const {
  navigateToBaseUrl,
  addBasicBaseTodos,
  expectHaveClass,
  expectNotHaveClass,
} = require("../helpers");

it("Should mark specific todo item as completed", async function () {
  await navigateToBaseUrl(page);
  await addBasicBaseTodos(page);

  await page.click(".todo-list > :nth-child(3) input[type=checkbox]");
  await expectHaveClass(page, ".todo-list > :nth-child(3)", "completed");

  // This should un-complete the todo item
  await page.click(".todo-list > :nth-child(3) input[type=checkbox]");

  await expectNotHaveClass(page, ".todo-list > :nth-child(3)", "completed");
}, 10_000);
