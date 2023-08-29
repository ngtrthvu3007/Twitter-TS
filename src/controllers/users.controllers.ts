import { Request, Response, NextFunction } from 'express'
import {
  RegisterReqBody,
  LogoutReqBody,
  LoginReqBody,
  VerifyEmailReqBody,
  ForgotPasswordReqBody,
  UpdateProfileReqBody,
  GetUserProfileReqBody,
  FollowUserReqBody,
  RefreshTokenReqBody
} from '~/models/requests/User.request'
import { ParamsDictionary } from 'express-serve-static-core'
import usersSevice from '../services/users.services'
import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schema'
import { MESSAGE } from '~/constants/messages'
import databaseService from '~/services/db.services'
import httpStatus from '~/constants/httpStatus'
import { TokenPayload } from '../models/requests/User.request'
import { UserVerifyStatus } from '~/constants/UserVerify.enum'
import { pick } from 'lodash'

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersSevice.login({ user_id: user_id.toString(), verify: user.verify })
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

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await usersSevice.logout(refresh_token)
  return res.json(result)
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { refresh_token } = req.body
  const { user_id, verify } = req.decoded_refresh_token as TokenPayload
  const result = await usersSevice.refreshToken({ user_id, verify, refresh_token })
  return res.json({
    message: MESSAGE.REQUEST_SUCCESS,
    result
  })
}

export const verifyEmailController = async (
  req: Request<ParamsDictionary, any, VerifyEmailReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })
  // user is not found
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      message: MESSAGE.USER_IS_NOT_FOUND
    })
  }
  console.log(user)
  //r return status 200 with message email had verified
  if (user.email_verify_token === '') {
    message: MESSAGE.EMail_HAD_VERIFIED
  }
  const result = await usersSevice.verifyEmail(user_id)
  return res.json({
    message: MESSAGE.EMail_VERIFY_SUCCESS,
    result
  })
}

export const resendEmailController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) return res.status(httpStatus.NOT_FOUND).json({ message: MESSAGE.USER_IS_NOT_FOUND })
  if (user.verify === UserVerifyStatus.Verified) return res.json({ message: MESSAGE.EMail_HAD_VERIFIED })

  const result = await usersSevice.resendEmailVerify(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { _id, verify } = req.user as User
  const result = await usersSevice.forgotPassword({ user_id: (_id as ObjectId).toString(), verify })
  return res.json(result)
}

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  return res.json({ message: MESSAGE.VERIFY_FORGOT_PASSWORD_SUCCESS })
}

export const resetPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = await usersSevice.resetPassword(user_id, password)
  console.log(result)
  return res.json(result)
}

export const getMyProfileController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersSevice.getMyProfile(user_id)
  return res.json({ message: MESSAGE.GET_YOUR_PROFILE, user })
}

export const updateMyProfileController = async (
  req: Request<ParamsDictionary, any, UpdateProfileReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const body = pick(req.body, [
    'name',
    'date_of_birth',
    'bio',
    'location',
    'avatar',
    'username',
    'website',
    'cover_photo'
  ])
  const user = await usersSevice.updateProfile(user_id, body)
  return res.json({ message: MESSAGE.UPDATE_YOUR_PROFILE_SUCCESS, user })
}

export const getUserProfileController = async (
  req: Request<ParamsDictionary, any, GetUserProfileReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { username } = req.params
  const user = await usersSevice.getUserProfile(username)
  return res.json({ message: MESSAGE.GET_PROFILE_USER_SUCCESS, user })
}

export const followUserController = async (
  req: Request<ParamsDictionary, any, FollowUserReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.body

  const result = await usersSevice.followUser(user_id, followed_user_id)
  return res.json(result)
}

export const unfollowUserController = async (
  req: Request<ParamsDictionary, any, FollowUserReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.body

  const result = await usersSevice.unfollowUser(user_id, followed_user_id)
  return res.json(result)
}
