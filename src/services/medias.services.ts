import { Request } from 'express'
import sharp from 'sharp'
import { handleUploadImage } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '../constants/env.config'
import dotenv from 'dotenv'
import { MediaType } from '~/constants/UserVerify.enum'
import { Media } from '~/models/Media'
dotenv.config()

class MediasService {
  async handleUploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const file_name = file.originalFilename as string
        await sharp(file.filepath).jpeg({}).toFile(file_name)
        fs.unlinkSync(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/uploads/image/${file_name}`
            : `http://localhost:${process.env.PORT}/uploads/image/${file_name}`,
          type: MediaType.Image
        }
      })
    )
    return result
  }
}

const mediasService = new MediasService()
export default mediasService
