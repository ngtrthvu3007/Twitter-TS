import { Request, Response, NextFunction } from 'express'
import { RegisterReqBody } from '~/models/requests/User.request'
import { ParamsDictionary } from 'express-serve-static-core'
import usersSevice from '../services/users.services'
import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schema'
import { MESSAGE } from '~/constants/messages'

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersSevice.login(user_id.toString())
  return res.json({
    message: MESSAGE.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersSevice.register(req.body)
  return res.json({
    message: MESSAGE.REGISTER_SUCCESS,
    result
  })
}
