import { Request, Response, NextFunction } from 'express'
import path from 'path'
import httpStatus from '~/constants/httpStatus'
import mediasService from '../services/medias.services'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.uploadImage(req)
  return res.json({ message: 'Uploads image success', result: result })
}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.uploadVideo(req)
  return res.json({ message: 'Uploads video success', result: result })
}
export const serveImageController = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return res.sendFile(path.resolve('', name), (err) => {
    if (err) {
      res.status(httpStatus.NOT_FOUND).send('Not found')
    }
  })
}

export const serveVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return await res.sendFile(path.resolve('uploads/temp', name), (err) => {
    if (err) {
      res.status(httpStatus.NOT_FOUND).send('Not found')
    }
  })
}
