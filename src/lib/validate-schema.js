import * as yup from 'yup'

export const pageSchema = yup.object({
    timeout: yup.number().default(30 * 1000),
    waitUntil: yup.string().default('networkidle'),
})