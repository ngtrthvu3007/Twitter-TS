import { Router } from 'express'
import { uploadImageController, uploadVideoController } from '~/controllers/medias.controllers'
import { wrapAsync } from '../utils/handlers'
import { accessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
const mediasRouter = Router()

mediasRouter.post('/upload_image', accessTokenValidator, verifiedUserValidator, wrapAsync(uploadImageController))
mediasRouter.post('/upload_video', accessTokenValidator, verifiedUserValidator, wrapAsync(uploadVideoController))
export default mediasRouter
