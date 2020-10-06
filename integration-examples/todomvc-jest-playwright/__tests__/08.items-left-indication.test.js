const { navigateToBaseUrl, addBasicBaseTodos } = require("../helpers");

it("Items left to complete indication", async function () {
  await navigateToBaseUrl(page);

  await addBasicBaseTodos(page);

  await expect(page).toEqualText(".todo-count", "4 items left");

  await page.click(".todo-list > :nth-child(3) input[type=checkbox]");
  await page.click(".todo-list > :nth-child(1) input[type=checkbox]");

  await expect(page).toEqualText(".todo-count", "2 items left");

  await page.click(".todo-list > :nth-child(3) input[type=checkbox]");

  await expect(page).toEqualText(".todo-count", "3 items left");
}, 300000);
