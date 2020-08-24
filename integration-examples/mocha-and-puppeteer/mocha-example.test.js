describe('Root Cause mocha example', () => {
    it('Testim demo example', async () => {
        await page.goto('https://demo.testim.io/');
        await page.click(".Hero__form-box___126DY > :nth-child(1) [type='text']");
        await page.click('.theme__days___3kAIy > div:nth-of-type(24) span');
        await page.click("[role='navigation'] > :nth-child(2)");
        await page.click(".Hero__form-box___126DY > :nth-child(2) [type='text']");
        await page.click('.theme__days___3kAIy > div:nth-of-type(26) span');
        await page.click("[role='navigation'] > :nth-child(2)");
        await page.click('.Hero__form-box___126DY > :nth-child(3) .theme__inputElement___27dyY');
        await page.click('.theme__active___31xyK .theme__values___1jS4g > :nth-child(4)');
        await page.click('.Hero__form-box___126DY > :nth-child(4) .theme__inputElement___27dyY');
        await page.click('.theme__active___31xyK .theme__values___1jS4g > :nth-child(3)');
        await page.click('.Hero__cta-button___9VskW');
        await page.click('.Gallery__items-box___2hOZl > :nth-child(2) .theme__button___1iKuo');
        await page.click("[maxlength='30']");
        await page.type("[maxlength='30']", 'Heya');
        await page.type("[type='email']", 'me@universe.com');
    }).timeout(30000);

    it('Testim demo example 2 fails', async () => {
        await page.goto('https://demo.testim.io/');
        await page.click(".Hero__form-box___126DY > :nth-child(1) [type='text']");
        await page.click('.none-existing-element');
    }).timeout(30000);
});
