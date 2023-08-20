import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { decode } from 'punycode'
import { TokenPayload } from '../models/requests/User.request'
dotenv.config()
export const signToken = ({
  payload,
  privateKey,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, function (err, token) {
      if (err) {
        throw reject(err)
      }
      resolve(token as string)
    })
  })
}

export const VerifyToken = ({ token, privateKey }: { token: string; privateKey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, privateKey, (err, decoded) => {
      if (err) {
        reject(err)
      }
      resolve(decoded as TokenPayload)
    })
  })
}
