import { checkSchema } from 'express-validator'
import { MESSAGE } from '~/constants/messages'
import { validate } from '~/utils/validation'
import usersSevice from '../services/users.services'
import databaseService from '~/services/db.services'
import { hashPassword } from '../utils/hashPassword'
import { VerifyToken } from '~/utils/jwt'
import { ErrorWithStatus } from '~/models/schemas/Errors'
import httpStatus from '~/constants/httpStatus'
import { JsonWebTokenError } from 'jsonwebtoken'
import { Request } from 'express'
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: MESSAGE.EMAIL_IS_INVALID
        },
        notEmpty: {
          errorMessage: MESSAGE.EMAIL_IS_REQUIRED
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(MESSAGE.USER_IS_NOT_FOUND)
            }
            req.user = user
            return true
          }
        }
      },
      password: {
        isStrongPassword: {
          options: {
            minLength: 1,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: MESSAGE.PASSWORD_MUST_BE_STRONG
        },
        notEmpty: {
          errorMessage: MESSAGE.PASSWORD_Is_REQUIRED
        },
        isString: {
          errorMessage: MESSAGE.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: MESSAGE.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
        }
      }
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: MESSAGE.NAME_Is_REQUIRED
        },
        isString: {
          errorMessage: MESSAGE.NAME_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 3,
            max: 10
          },
          errorMessage: MESSAGE.NAME_LENGTH_MUST_BE_FROM_1_TO_100
        }
      },
      email: {
        isEmail: {
          errorMessage: MESSAGE.EMAIL_IS_INVALID
        },
        notEmpty: {
          errorMessage: MESSAGE.EMAIL_IS_REQUIRED
        },
        trim: true,
        custom: {
          options: async (value) => {
            const isExists = await usersSevice.checkEmailExist(value)
            if (isExists) {
              throw new Error(MESSAGE.EMAIL_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      password: {
        isStrongPassword: {
          options: {
            minLength: 1,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: MESSAGE.PASSWORD_MUST_BE_STRONG
        },
        notEmpty: {
          errorMessage: MESSAGE.PASSWORD_Is_REQUIRED
        },
        isString: {
          errorMessage: MESSAGE.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: MESSAGE.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
        }
      },
      confirm_password: {
        isStrongPassword: {
          options: {
            minLength: 1,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: MESSAGE.CONFIRM_PASSWORD_MUST_BE_STRONG
        },
        notEmpty: {
          errorMessage: MESSAGE.CONFIRM_PASSWORD_Is_REQUIRED
        },
        isString: { errorMessage: MESSAGE.CONFIRM_PASSWORD_MUST_BE_A_STRING },
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: MESSAGE.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
        },
        custom: {
          options: async (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(MESSAGE.CONFIRM_PASSWORD_NOT_MATCH)
            }
            return true
          }
        }
      },
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          }
        }
      }
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: {
          errorMessage: MESSAGE.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({ message: MESSAGE.ACCESS_TOKEN_IS_REQUIRED, status: httpStatus.UNAUTHORIZED })
            }
            const decoded_authorization = await VerifyToken({ token: access_token })
            ;(req as Request).decoded_authorization = decoded_authorization
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        notEmpty: {
          errorMessage: MESSAGE.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                VerifyToken({ token: value }),
                databaseService.refreshTokens.findOne({ token: value })
              ])
              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: MESSAGE.REFRESH_TOKEN_IS_NOT_FOUND,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              req.decoded_refresh_token = decoded_refresh_token
            } catch (err) {
              if (err instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: MESSAGE.REFRESH_TOKEN_IS_INVALID,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              throw err
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
