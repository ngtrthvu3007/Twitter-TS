import { Request, Response, NextFunction } from 'express'
import httpStatus from '~/constants/httpStatus'
import { omit } from 'lodash'
import { ErrorWithStatus } from '~/models/schemas/Errors'
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    res.status(err.status).json(omit(err, 'status'))
  }

  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })

  res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    error_info: omit(err, 'stack')
  })
}
