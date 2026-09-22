import RNFS from 'react-native-fs'
import { downloadFile, mkdir, existsFile } from '@/utils/fs'

export interface DownloadTask {
  id: string
  title: string
  singer: string
  album?: string
  pic?: string
  quality: 'flac' | '320k' | '128k'
  url: string
  savePath: string
  progress: number
  status: 'pending' | 'downloading' | 'completed' | 'error'
  error?: string
}

const MUSIC_DOWNLOAD_DIR = '/storage/emulated/0/Music/CJYMusic'

class DownloadManager {
  private activeJobId: number | null = null

  async init(): Promise<void> {
    try {
      const exists = await existsFile(MUSIC_DOWNLOAD_DIR)
      if (!exists) {
        await mkdir(MUSIC_DOWNLOAD_DIR)
      }
    } catch (e) {
      console.warn('[Download] Dir init error:', e)
    }
  }

  async startDownload(
    music: { id: string; name: string; singer: string; albumName?: string; pic?: string },
    quality: 'flac' | '320k' = 'flac',
    directUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    await this.init()

    const ext = quality === 'flac' ? 'flac' : 'mp3'
    const cleanName = `${music.singer} - ${music.name}`.replace(/[\\/:*?"<>|]/g, '_')
    const destPath = `${MUSIC_DOWNLOAD_DIR}/${cleanName}.${ext}`

    return new Promise((resolve, reject) => {
      const res = downloadFile(directUrl, destPath, {
        progressDivider: 2,
        progressInterval: 250,
        progress: (p) => {
          const percent = Math.round((p.bytesWritten / p.contentLength) * 100)
          if (onProgress) onProgress(percent)
        }
      })

      this.activeJobId = res.jobId

      res.promise
        .then((result) => {
          this.activeJobId = null
          if (result.statusCode === 200 || result.statusCode === 206) {
            if (music.pic) {
              const coverPath = `${MUSIC_DOWNLOAD_DIR}/${cleanName}.jpg`
              void downloadFile(music.pic, coverPath, {}).promise.catch(() => {})
            }
            resolve(destPath)
          } else {
            reject(new Error(`Download failed with status ${result.statusCode}`))
          }
        })
        .catch((err) => {
          this.activeJobId = null
          reject(err)
        })
    })
  }
}

export const downloadManager = new DownloadManager()
export default downloadManager
