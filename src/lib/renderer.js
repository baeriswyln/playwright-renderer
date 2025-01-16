import {chromium} from 'playwright'

const delay = ms => new Promise(res => setTimeout(res, ms));

export class Renderer {
    browser;

    constructor(browser) {
        this.browser = browser
    }

    async html(url, pageOptions) {
        let page

        try {
            page = await this.createPage(url, pageOptions)
            return await page.content()
        } finally {
            await this.closePage(page)
        }
    }

    async createPage(url, pageOptions) {
        let page;

        try {
            page = await this.browser.newPage()

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

            return page
        } catch (e) {
            console.error(e)
            await this.closePage(page)
            throw e
        }
    }

    async closePage(page) {
        try {
            if (page && !page.isClosed()) {
                await page.close()
            }
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