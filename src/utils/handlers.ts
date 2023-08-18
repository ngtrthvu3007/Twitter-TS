import { Request, Response, NextFunction, RequestHandler } from 'express'

export const wrapAsync = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(123)
      await func(req, res, next)
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
}
