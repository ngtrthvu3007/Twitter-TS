import { TokenType } from './../../constants/UserVerify.enum'
import { Jwt, JwtPayload } from 'jsonwebtoken'

export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}
export interface LogutReqBody {
  refresh_token: string
}
export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
}
