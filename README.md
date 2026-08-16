# Playwright-renderer

Inspired by the [puppeteer-renderer](https://github.com/zenato/puppeteer-renderer), this is a headless playwright
based page renderer.

A requested web page is rendered server-side, and returns the rendered page as an HTML file.

## Getting started

Start the server using docker.

```shell
docker run -d --name renderer -p 3000:3000 baeriswyln/playwright-renderer
```

Build the docker image yourself.

```shell
docker build -t playwright-renderer .
docker run -d --name renderer -p 3000:3000 playwright-renderer
```

## Usage

Available endpoints: `/html`

| Name        | Required | Unit | Default       | Description                                                                                                              |
|-------------|----------|------|---------------|--------------------------------------------------------------------------------------------------------------------------|
| `url`       | yes      |      |               | The target URL                                                                                                           |
| `timeout`   |          | ms   | 30000         | Timeout after which the rendering will cancel and throw an error                                                         |
| `selector`  |          |      |               | Page is being loaded until the given selector is present                                                                 |
| `waitUntil` |          |      | `networkidle` | Waits until the criteria is fulfilled. [List of supported values](https://playwright.dev/docs/api/class-page#page-goto). |

## Configuration

| Env var                   | Default | Description                                                        |
|----------------------------|---------|---------------------------------------------------------------------|
| `PORT`                     | `3000`  | Port the server listens on.                                        |
| `MAX_CONCURRENT_RENDERS`   | `2`     | Max number of browser contexts/pages open at the same time. Extra requests are queued rather than opening unbounded contexts. |
| `BROWSER_IDLE_TIMEOUT_MS`  | `300000` (5 min) | Chromium is launched lazily on the first request after being idle, and closed again once no render has been active for this long, freeing its memory back to the OS. |
