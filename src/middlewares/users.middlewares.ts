import { checkSchema, ParamSchema } from 'express-validator'
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
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'

const passwordSchema: ParamSchema = {
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
  },
  isStrongPassword: {
    options: {
      minLength: 1,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: MESSAGE.PASSWORD_MUST_BE_STRONG
  }
}

const confirmPasswordSchema: ParamSchema = {
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
}

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
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || '').split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({ message: MESSAGE.ACCESS_TOKEN_IS_REQUIRED, status: httpStatus.UNAUTHORIZED })
            }
            const decoded_authorization = await VerifyToken({
              token: access_token,
              privateKey: process.env.PRIVATE_ACCESS_KEY as string
            })
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
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: MESSAGE.REFRESH_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                VerifyToken({ token: value, privateKey: process.env.PRIVATE_REFRESH_KEY as string }),
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

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: MESSAGE.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decoded_email_verify_token = await VerifyToken({
                token: value,
                privateKey: process.env.PRIVATE_EMAIL_KEY as string
              })
              req.decoded_email_verify_token = decoded_email_verify_token
            } catch (err) {
              throw new ErrorWithStatus({
                message: capitalize((err as JsonWebTokenError).message),
                status: httpStatus.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const emailValidator = validate(
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
              email: value
            })
            if (user === null) {
              throw new Error(MESSAGE.USER_IS_NOT_FOUND)
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: MESSAGE.FORGOT_PASSWORK_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decoded_forgot_password_token = await VerifyToken({
                token: value,
                privateKey: process.env.PRIVATE_FORGOT_PASSWORD_KEY as string
              })
              const { user_id } = decoded_forgot_password_token
              const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

              if (user === null) {
                throw new ErrorWithStatus({
                  message: MESSAGE.USER_IS_NOT_FOUND,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: MESSAGE.FORGOT_PASSWORD_IS_NOT_MATCH,
                  status: httpStatus.UNAUTHORIZED
                })
              }
            } catch (err) {
              if (err instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: MESSAGE.FORGOT_PASSWORK_TOKEN_IS_REQUIRED,
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
export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: MESSAGE.FORGOT_PASSWORK_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decoded_forgot_password_token = await VerifyToken({
                token: value,
                privateKey: process.env.PRIVATE_FORGOT_PASSWORD_KEY as string
              })
              const { user_id } = decoded_forgot_password_token
              const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

              if (user === null) {
                throw new ErrorWithStatus({
                  message: MESSAGE.USER_IS_NOT_FOUND,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: MESSAGE.FORGOT_PASSWORD_IS_NOT_MATCH,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              req.decoded_forgot_password_token = decoded_forgot_password_token
            } catch (err) {
              if (err instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: MESSAGE.FORGOT_PASSWORK_TOKEN_IS_REQUIRED,
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
