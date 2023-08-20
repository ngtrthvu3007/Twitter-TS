import { Router } from 'express'
import {
  loginController,
  logoutController,
  registerController,
  verifyEmailController,
  resendEmailController,
  forgotPasswordController,
  verifyForgotPasswordController,
  resetPasswordController,
  getMyProfileController
} from '~/controllers/users.controllers'
import { wrapAsync } from '~/utils/handlers'
import {
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  emailVerifyTokenValidator,
  accessTokenValidator,
  emailValidator,
  verifyForgotPasswordTokenValidator,
  resetPasswordValidator
} from '~/middlewares/users.middlewares'

const userRouter = Router()

userRouter.post('/login', loginValidator, wrapAsync(loginController))
userRouter.post('/register', registerValidator, wrapAsync(registerController))
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))
userRouter.post('/verify_email', emailVerifyTokenValidator, wrapAsync(verifyEmailController))
userRouter.post('/resend_email', accessTokenValidator, wrapAsync(resendEmailController))
userRouter.post('/forgot_password', emailValidator, wrapAsync(forgotPasswordController))
userRouter.post(
  '/verify_forgot_password',
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordController)
)
userRouter.post('/reset_password', resetPasswordValidator, wrapAsync(resetPasswordController))
userRouter.get('/profile', accessTokenValidator, wrapAsync(getMyProfileController))
export default userRouter
