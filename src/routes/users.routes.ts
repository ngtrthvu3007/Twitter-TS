import { Router } from 'express'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { loginController, registerController } from '~/controllers/users.controllers'
import { wrapAsync } from '~/utils/handlers'
import { accessTokenValidator } from '../middlewares/users.middlewares'
const userRouter = Router()

userRouter.post('/login', loginValidator, wrapAsync(loginController))
userRouter.post('/register', registerValidator, wrapAsync(registerController))
userRouter.post(
  '/logout',
  accessTokenValidator,
  wrapAsync((req, res) => {
    console.log(req)
    res.json({ message: 'success' })
  })
)
export default userRouter
