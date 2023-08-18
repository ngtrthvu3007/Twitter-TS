import databaseService from '~/services/db.services'
import User from '~/models/schemas/User.schema'
import { RegisterReqBody } from '~/models/requests/User.request'
import { hashPassword } from '../utils/hashPassword'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/UserVerify.enum'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()

class UsersService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
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
      options: {
        expiresIn: process.env.EXPIRED_IN_RT
      }
    })
  }
  private signAccessAndRefresToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
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
  async register(payload: RegisterReqBody) {
    //push req params to db
    const result = await databaseService.users.insertOne(
      new User({ ...payload, date_of_birth: new Date(payload.date_of_birth), password: hashPassword(payload.password) })
    )
    //response for client
    const user_id = result.insertedId.toString()
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
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
}
const usersSevice = new UsersService()
export default usersSevice
