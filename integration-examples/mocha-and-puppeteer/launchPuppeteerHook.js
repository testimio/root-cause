const puppeteer = require('puppeteer');

const mochaHooks = {
    async beforeAll() {
        global.browser = await puppeteer.launch();
    },
    async beforeEach() {
        global.page = await global.browser.newPage();
    },
    async afterEach() {
        await global.page.close();
    },
    async afterAll() {
        await global.browser.close();
    },
};

exports.mochaHooks = mochaHooks;
