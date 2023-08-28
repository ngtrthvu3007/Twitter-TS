import { Router } from 'express'
import { uploadImageController } from '~/controllers/medias.controllers'
import { wrapAsync } from '../utils/handlers'
const mediasRouter = Router()

mediasRouter.post('/upload_image', wrapAsync(uploadImageController))
export default mediasRouter
