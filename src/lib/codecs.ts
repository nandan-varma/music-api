import crypto from 'node-forge'

const DOWNLOAD_QUALITIES = [
  { suffix: '_12', bitrate: '12kbps' },
  { suffix: '_48', bitrate: '48kbps' },
  { suffix: '_96', bitrate: '96kbps' },
  { suffix: '_160', bitrate: '160kbps' },
  { suffix: '_320', bitrate: '320kbps' }
] as const

const IMAGE_QUALITIES = ['50x50', '150x150', '500x500'] as const
const IMAGE_QUALITY_PATTERN = /150x150|50x50/
const INSECURE_PROTOCOL_PATTERN = /^http:\/\//

/** JioSaavn encrypts media URLs with a fixed, publicly known DES key — this reverses that, not a real secret. */
const MEDIA_URL_CIPHER_KEY = '38346591'
const MEDIA_URL_CIPHER_IV = '00000000'

export interface Link {
  quality: string
  url: string
}

export const decryptMediaLinks = (encryptedMediaUrl: string): Link[] => {
  if (!encryptedMediaUrl) return []

  const decipher = crypto.cipher.createDecipher('DES-ECB', crypto.util.createBuffer(MEDIA_URL_CIPHER_KEY))
  decipher.start({ iv: crypto.util.createBuffer(MEDIA_URL_CIPHER_IV) })
  decipher.update(crypto.util.createBuffer(crypto.util.decode64(encryptedMediaUrl)))
  decipher.finish()

  const decryptedUrl = decipher.output.getBytes()

  return DOWNLOAD_QUALITIES.map(({ bitrate, suffix }) => ({
    quality: bitrate,
    url: decryptedUrl.replace('_96', suffix)
  }))
}

export const imageLinks = (link: string): Link[] => {
  if (!link) return []

  return IMAGE_QUALITIES.map((quality) => ({
    quality,
    url: link.replace(IMAGE_QUALITY_PATTERN, quality).replace(INSECURE_PROTOCOL_PATTERN, 'https://')
  }))
}
