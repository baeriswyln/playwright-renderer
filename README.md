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
