import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { decode } from 'punycode'
dotenv.config()
export const signToken = ({
  payload,
  privateKey = process.env.PRIVATE_KEY as string,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey?: string
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

export const VerifyToken = ({
  token,
  privateKey = process.env.PRIVATE_KEY as string
}: {
  token: string
  privateKey?: string
}) => {
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(token, privateKey, (err, decoded) => {
      if (err) {
        console.log(err)
        reject(err)
      }
      resolve(decoded as jwt.JwtPayload)
    })
  })
}
