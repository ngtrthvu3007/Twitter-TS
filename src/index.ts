import express from 'express'
import users_router from '~/routes/users.routes'
import medias_router from '~/routes/medias.routes'
import uploads_router from './routes/uploads.routes'
import databaseService from '~/services/db.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import morgan from 'morgan'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
const port = process.env.PORT || 5050
databaseService.connect()
app.use(morgan('tiny'))
app.use(express.json())
app.use('/uploads', uploads_router)
app.use('/users', users_router)
app.use('/medias', medias_router)
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Server is ready on port ${port}`)
})
