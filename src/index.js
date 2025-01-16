import qs from 'qs'
import express from 'express'
import createRenderer from './lib/renderer.js'
import router from './router.js'

const port = process.env.PORT || 3000

const app = express()

// Configure.
app.disable('x-powered-by')
app.set('query parser', (s) => qs.parse(s, {allowDots: true}))

// Render url.
app.use(router)

// Index
app.get('/', (req, res) => {
    res
        .status(200)
        .send(
            `You can use <a href="/html">/html</a> endpoint.`,
        )
})

// Not found page.
app.use((req, res) => {
    res.status(404).send('Not found.')
})

// Error page.
app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).send('Oops, An expected error seems to have occurred.')
})

// Create renderer and start server.
createRenderer().then(() => {
    app.listen(port, () => {
        console.info(`Listen port on ${port}.`)
    })
}).catch(e => {
    console.error('Fail to initialize renderer.', e)
})

// Terminate process
process.on('SIGINT', () => {
    process.exit(0)
})
