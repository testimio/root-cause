const { navigateToBaseUrl, addBasicBaseTodos, sendSpecialCharacter } = require("../helpers");

it("Should edit todo", async function () {
  await navigateToBaseUrl(page);
  await addBasicBaseTodos(page);

  await page.click(".todo-list > :nth-child(2) label", {
    clickCount: 2,
  });

  await page.type(".todo-list > :nth-child(2) input.edit", " with Mushrooms");

  await sendSpecialCharacter(page, ".todo-list > :nth-child(2) input.edit", "Enter");

  await expect(page).toMatchElement(".todo-list > :nth-child(2) label", {
    text: "Order Pizza with Mushrooms",
  });
});
