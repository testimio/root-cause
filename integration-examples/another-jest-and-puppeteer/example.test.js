describe('Example demo testim', () => {
    test('testim demo example', async () => {
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

        const text = await (await (await page.$('title')).getProperty('innerText')).jsonValue();
        expect(text).toBe('Space & Beyond | Testim.io demo');
    }, 10000);

    test('wikipedia example fail', async () => {
        await page.goto('https://www.wikipedia.org/');
        await page.click('#js-link-box-en');
        await page.click('#n-currentevents');

        const text = await (await (await page.$('title')).getProperty('innerText')).jsonValue();
        expect(text).toBe('Incorrect title');
    }, 10000);
});
