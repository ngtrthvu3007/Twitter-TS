import databaseService from '~/services/db.services'
import User from '~/models/schemas/User.schema'
import { RegisterReqBody } from '~/models/requests/User.request'
import { hashPassword } from '../utils/hashPassword'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/UserVerify.enum'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import { MESSAGE } from '../constants/messages'
import { omit } from 'lodash'
dotenv.config()

class UsersService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      privateKey: process.env.PRIVATE_ACCESS_KEY as string,
      options: {
        expiresIn: process.env.EXPIRED_IN_RT
      }
    })
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.PRIVATE_REFRESH_KEY as string,
      options: {
        expiresIn: process.env.EXPIRED_IN_RT
      }
    })
  }
  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: process.env.PRIVATE_EMAIL_KEY as string,
      options: {
        expiresIn: process.env.EXPIRED_IN_EMAIL
      }
    })
  }

  private signAccessAndRefresToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  private signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken
      },
      privateKey: process.env.PRIVATE_FORGOT_PASSWORD_KEY as string,
      options: {
        expiresIn: process.env.EXPIRED_IN_FORGOT_PASSWORD
      }
    })
  }

  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefresToken(user_id)
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
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    //push req params to db
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    //response for client
    const [access_token, refresh_token] = await this.signAccessAndRefresToken(user_id.toString())
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
    const [access_token, refresh_token] = await this.signAccessAndRefresToken(user_id)
    return {
      access_token,
      refresh_token
    }
  }

  async resendEmailVerify(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken(user_id)
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

  async forgotPassword(user_id: string) {
    const forgot_password_token = await this.signForgotPasswordToken(user_id)

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
}
const usersSevice = new UsersService()
export default usersSevice
