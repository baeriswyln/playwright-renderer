import * as yup from 'yup'
import express from 'express'
import { renderer } from './lib/renderer.js'
import { pageSchema } from './lib/validate-schema.js'

const router = express.Router()

const urlSchema = yup.object({ url: yup.string().required() }).transform(current => {
    const regex = /^https?:\/\//;
    if (!regex.test(current.url)) {
        current.url = `https://${current.url}`
    }
    return current;
})

router.get('/html', async (req, res, next) => {
    try {
        const { url, ...pageOptions } = urlSchema.concat(pageSchema).validateSync(req.query)
        const html = await renderer.html(url, pageOptions)
        res.status(200).send(html)
    } catch (e) {
        next(e)
    }
})

export default router
