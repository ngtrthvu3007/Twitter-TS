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
  getMyProfileController,
  updateMyProfileController,
  getUserProfileController,
  followUserController,
  unfollowUserController
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
  resetPasswordValidator,
  verifiedUserValidator,
  updateProfileValidator,
  followUserValidator
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
userRouter.patch(
  '/profile',
  accessTokenValidator,
  verifiedUserValidator,
  updateProfileValidator,
  wrapAsync(updateMyProfileController)
)
userRouter.get('/:username', wrapAsync(getUserProfileController))

userRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followUserValidator,
  wrapAsync(followUserController)
)
userRouter.post(
  '/unfollow',
  accessTokenValidator,
  verifiedUserValidator,
  followUserValidator,
  wrapAsync(unfollowUserController)
)
export default userRouter
