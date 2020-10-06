const { sendSpecialCharacter, navigateToBaseUrl, addBasicBaseTodos } = require("../helpers");

describe("Hover and delete todo", function () {
  it("Hover and delete specific todo", async function () {
    await navigateToBaseUrl(page);
    await addBasicBaseTodos(page);

    // Wash the dishes
    await page.hover(".todo-list > :nth-child(3) label");
    await page.click(".todo-list > :nth-child(3) button.destroy");

    // Talk to Ben is now 3
    await expect(page).toEqualText(".todo-list > :nth-child(3) label", "Talk to Ben");
  }, 30000);
});
