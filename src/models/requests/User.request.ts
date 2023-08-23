import { TokenType } from './../../constants/UserVerify.enum'
import { Jwt, JwtPayload } from 'jsonwebtoken'

export interface LoginReqBody {
  email: string
  password: string
}

export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}
export interface LogoutReqBody {
  refresh_token: string
}
export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
}

export interface VerifyEmailReqBody {
  email_verify_token: string
}

export interface ForgotPasswordReqBody {
  email: string
}
export interface UpdateProfileReqBody {
  nam?: string
  date_of_birth?: Date
  bio?: string // optional
  location?: string // optional
  website?: string // optional
  username?: string // optional
  avatar?: string // optional
  cover_photo?: string // optional
}

export interface GetUserProfileReqBody {
  username: string
}

export interface FollowUserReqBody {
  user_id: string
  followed_user_id: string
}
