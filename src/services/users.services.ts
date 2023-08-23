import databaseService from '~/services/db.services'
import User from '~/models/schemas/User.schema'
import { RegisterReqBody, UpdateProfileReqBody } from '~/models/requests/User.request'
import { hashPassword } from '../utils/hashPassword'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/UserVerify.enum'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import { MESSAGE } from '../constants/messages'
import { omit } from 'lodash'
import { ErrorWithStatus } from '../models/schemas/Errors'
import httpStatus from '~/constants/httpStatus'
import Follower from '../models/schemas/Follower.schema'

dotenv.config()

class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.PRIVATE_ACCESS_KEY as string,
      options: {
        expiresIn: process.env.EXPIRED_IN_RT
      }
    })
  }
  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.PRIVATE_REFRESH_KEY as string,
      options: {
        expiresIn: process.env.EXPIRED_IN_RT
      }
    })
  }
  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.PRIVATE_EMAIL_KEY as string,
      options: {
        expiresIn: process.env.EXPIRED_IN_EMAIL
      }
    })
  }

  private signAccessAndRefresToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.PRIVATE_FORGOT_PASSWORD_KEY as string,
      options: {
        expiresIn: process.env.EXPIRED_IN_FORGOT_PASSWORD
      }
    })
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefresToken({
      user_id,
      verify: UserVerifyStatus.Verified
    })
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }
  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: MESSAGE.LOGOUT_SUCCESS
    }
  }
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    //push req params to db
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    //response for client
    const [access_token, refresh_token] = await this.signAccessAndRefresToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async verifyEmail(user_id: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { email_verify_token: '', verify: UserVerifyStatus.Verified },
        $currentDate: { updated_at: true }
      }
    )
    const [access_token, refresh_token] = await this.signAccessAndRefresToken({
      user_id,
      verify: UserVerifyStatus.Verified
    })
    return {
      access_token,
      refresh_token
    }
  }

  async resendEmailVerify(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified
    })
    console.log('Resend email: ', email_verify_token)

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { email_verify_token }, $currentDate: { updated_at: true } }
    )
    return {
      message: MESSAGE.RESEND_EMail_SUCCESS
    }
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })

    console.log('service: ', forgot_password_token)
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token,
          updated_at: '$$NOW'
        }
      }
    ])
    //console.log('forgot_token: ', forgot_password_token)
    return {
      message: MESSAGE.RESET_PASSWORD_EMAIL_HAVE_SENT
    }
  }

  async resetPassword(user_id: string, password: string) {
    databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password),
          updated_at: '$$NOW'
        }
      }
    ])
    return { message: MESSAGE.RESET_PASSWORD_SUCCESS }
  }
  async getMyProfile(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    return omit(user, ['password', 'email_verify_token', 'forgot_password_token'])
  }
  async updateProfile(user_id: string, payload: UpdateProfileReqBody) {
    const _paload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      { $set: { ..._paload }, $currentDate: { updated_at: true } },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user.value
  }
  async getUserProfile(username: string) {
    const omit_arr = ['password', 'email_verify_token', 'forgot_password_token', 'verify']
    const user = await databaseService.users.findOne({ username: username })
    if (!user) {
      throw new ErrorWithStatus({
        message: MESSAGE.USER_IS_NOT_FOUND,
        status: httpStatus.NOT_FOUND
      })
    }
    return omit(user, omit_arr)
  }
  async followUser(user_id: string, followed_user_id: string) {
    const followedUser = await databaseService.users.findOne({
      _id: new ObjectId(followed_user_id)
    })

    if (followedUser?.verify !== UserVerifyStatus.Verified) {
      return { message: MESSAGE.USER_IS_NOT_ACTIVE }
    }
    const existingFollow = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (!existingFollow) {
      await databaseService.followers.insertOne({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })

      return { message: MESSAGE.FOLLOW_USER_SUCCESS }
    } else {
      return { message: MESSAGE.USER_IS_FOLLOWED }
    }
  }
  async unfollowUser(user_id: string, followed_user_id: string) {
    const existingFollow = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (existingFollow) {
      await databaseService.followers.deleteOne({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })

      return { message: MESSAGE.UNFOLLOW_USER_SUCCESS }
    } else {
      return { message: MESSAGE.NOT_FOLLOW_YET }
    }
  }
}
const usersSevice = new UsersService()
export default usersSevice
