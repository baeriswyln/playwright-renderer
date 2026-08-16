import {chromium} from 'playwright'

const delay = ms => new Promise(res => setTimeout(res, ms))

const MAX_CONCURRENT_RENDERS = Number(process.env.MAX_CONCURRENT_RENDERS) || 2

// Extra time on top of the caller's own `timeout` before the watchdog gives up
// on a render. This is a backstop for hangs that aren't covered by Playwright's
// own timeouts (goto/waitForSelector), so a page/context can never be stuck open
// forever - it protects against bugs we haven't found yet, not just #1.
const WATCHDOG_MARGIN_MS = 10 * 1000

// Requests are infrequent and not time-critical, so we don't keep a browser
// resident between them. It's launched lazily on first use and torn down again
// after this much idle time, releasing its memory back to the OS.
const BROWSER_IDLE_TIMEOUT_MS = Number(process.env.BROWSER_IDLE_TIMEOUT_MS) || 5 * 60 * 1000

class Semaphore {
    constructor(max) {
        this.max = max
        this.current = 0
        this.queue = []
    }

    acquire() {
        if (this.current < this.max) {
            this.current++
            return Promise.resolve()
        }
        return new Promise(resolve => this.queue.push(resolve)).then(() => {
            this.current++
        })
    }

    release() {
        this.current--
        const next = this.queue.shift()
        if (next) next()
    }
}

export class Renderer {
    browser
    semaphore
    activeRenders = 0
    launchingBrowser
    idleTimer

    constructor() {
        this.semaphore = new Semaphore(MAX_CONCURRENT_RENDERS)
    }

    async ensureBrowser() {
        clearTimeout(this.idleTimer)

        if (this.browser?.isConnected()) {
            return this.browser
        }

        // Coalesce concurrent callers into a single launch instead of racing.
        if (!this.launchingBrowser) {
            console.info('Launching browser.')
            this.launchingBrowser = chromium.launch({headless: true}).finally(() => {
                this.launchingBrowser = undefined
            })
        }

        this.browser = await this.launchingBrowser
        return this.browser
    }

    scheduleIdleShutdown() {
        clearTimeout(this.idleTimer)
        this.idleTimer = setTimeout(() => this.shutdownIdleBrowser(), BROWSER_IDLE_TIMEOUT_MS)
        this.idleTimer.unref?.()
    }

    async shutdownIdleBrowser() {
        const browser = this.browser
        this.browser = undefined
        if (!browser) return

        try {
            await browser.close()
            console.info('Closed idle browser instance.')
        } catch (e) {
            console.error('Failed to close idle browser.', e)
        }
    }

    async html(url, pageOptions) {
        await this.semaphore.acquire()
        this.activeRenders++
        clearTimeout(this.idleTimer)

        let page
        let context
        let settled = false

        const renderPromise = (async () => {
            try {
                [page, context] = await this.createPage(url, pageOptions)
                return await page.content()
            } finally {
                await this.closePage(page, context)
                this.semaphore.release()
                settled = true
                this.activeRenders--
                if (this.activeRenders === 0) this.scheduleIdleShutdown()
            }
        })()

        const watchdogMs = (pageOptions.timeout ?? 30 * 1000) + WATCHDOG_MARGIN_MS
        let watchdog
        const watchdogPromise = new Promise((_, reject) => {
            watchdog = setTimeout(() => {
                reject(new Error(`Render watchdog: exceeded ${watchdogMs}ms while rendering ${url}`))
            }, watchdogMs)
        })

        try {
            return await Promise.race([renderPromise, watchdogPromise])
        } finally {
            clearTimeout(watchdog)
            // If the watchdog won the race, renderPromise is still running
            // somewhere (stuck). Let it keep going in the background so its own
            // `finally` above still closes the page/context and releases the
            // concurrency slot, instead of leaking them; just don't let its
            // eventual rejection become an unhandled rejection.
            if (!settled) renderPromise.catch(() => {})
        }
    }

    async createPage(url, pageOptions) {
        let page
        let context

        try {
            const browser = await this.ensureBrowser()

            // use separate context for every request to prevent caching
            context = await browser.newContext()
            page = await context.newPage()

            await page.goto(url, pageOptions)

            if (pageOptions.selector) {
                await page.waitForSelector(pageOptions.selector, {timeout: pageOptions.timeout})
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
            console.error('Failed to close page/context.', e)
        }
    }

    async close() {
        clearTimeout(this.idleTimer)
        if (this.browser) await this.browser.close()
    }
}

export let renderer = undefined

export default function create() {
    renderer = new Renderer()
    return renderer
}
