import router from '~/routes/users.routes'
import databaseService from '~/services/db.services'
import express from 'express'
import { defaultErrorHandler } from './middlewares/error.middlewares'
var morgan = require('morgan')
const app = express()
const port = 3000
app.use(morgan('tiny'))
databaseService.connect()
app.use(express.json())
app.use('/users', router)
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
