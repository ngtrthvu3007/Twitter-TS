import { Router } from 'express'
import { loginValidator, refreshTokenValidator, registerValidator } from '~/middlewares/users.middlewares'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import { wrapAsync } from '~/utils/handlers'
import { accessTokenValidator } from '../middlewares/users.middlewares'
const userRouter = Router()

userRouter.post('/login', loginValidator, wrapAsync(loginController))
userRouter.post('/register', registerValidator, wrapAsync(registerController))
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))
userRouter.post('/verify_email', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))
export default userRouter
