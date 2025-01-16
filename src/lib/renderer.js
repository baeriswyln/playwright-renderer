import {chromium} from 'playwright'

const delay = ms => new Promise(res => setTimeout(res, ms));

export class Renderer {
    browser;

    constructor(browser) {
        this.browser = browser
    }

    async html(url, pageOptions) {
        let page
        let context

        try {
            [page, context] = await this.createPage(url, pageOptions)
            return await page.content()
        } finally {
            await this.closePage(page, context)
        }
    }

    async createPage(url, pageOptions) {
        let page;
        let context;

        try {
            // use separate context for every request to prevent caching
            context = await this.browser.newContext()
            page = await context.newPage()

            await page.goto(url, pageOptions)

            if (pageOptions.selector) {
                await page.evaluate(async (selector) => {
                    const delay = ms => new Promise(res => setTimeout(res, ms));
                    while (!document.querySelector(selector)) {
                        await delay(100)
                    }
                    return !!document.querySelector(selector)
                }, pageOptions.selector)

                await delay(500)
            }

            return [page, context]
        } catch (e) {
            console.error(e)
            await this.closePage(page, context)
            throw e
        }
    }

    async closePage(page, context) {
        try {
            if (page && !page.isClosed()) await page.close()
            if (context) await context.close()
        } catch (e) {

        }
    }

    async close() {
        await this.browser.close()
    }
}

export let renderer = undefined

export default async function create() {
    const browser = await chromium.launch({
        headless: true
    })
    renderer = new Renderer(browser)

    return renderer
}