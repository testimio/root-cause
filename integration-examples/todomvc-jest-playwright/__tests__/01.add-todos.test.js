const { navigateToBaseUrl, sendSpecialCharacter } = require("../helpers");

it("Should add 4 todos", async function () {
  await navigateToBaseUrl(page);

  await page.type(".new-todo", "Buy milk");
  await sendSpecialCharacter(page, ".new-todo", "Enter");

  await page.type(".new-todo", "Order Pizza");
  await sendSpecialCharacter(page, ".new-todo", "Enter");

  await page.type(".new-todo", "Wash the dishes");
  await sendSpecialCharacter(page, ".new-todo", "Enter");

  await page.type(".new-todo", "Talk to Ben");
  await sendSpecialCharacter(page, ".new-todo", "Enter");

  await expect(page).toEqualText(".todo-list > :nth-child(1) label", "Buy milk");
  await expect(page).toEqualText(".todo-list > :nth-child(2) label", "Order Pizza");
  await expect(page).toEqualText(".todo-list > :nth-child(3) label", "Wash the dishes");
  await expect(page).toEqualText(".todo-list > :nth-child(4) label", "Talk to Ben");
});
