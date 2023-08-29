import { Request } from 'express'
import formidable, { File } from 'formidable'
import path from 'path'
export const handleUploadImage = (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve('uploads/temp'),
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 300 * 1024,
    maxTotalFileSize: 300 * 1024 * 4,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is invalid') as any)
      }
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.image as File[])
    })
  })
}

export const handleUploadVideo = (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve('uploads/temp'),
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 10000 * 1024,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('video/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is invalid') as any)
      }
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.video)
    })
  })
}
