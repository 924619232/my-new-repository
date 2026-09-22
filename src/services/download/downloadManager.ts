import { Platform, PermissionsAndroid } from 'react-native'
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

const PRIMARY_DOWNLOAD_DIR = '/storage/emulated/0/Music/CJYMusic'

class DownloadManager {
  private activeJobId: number | null = null
  private writableDir: string = PRIMARY_DOWNLOAD_DIR

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true
    try {
      if (Platform.Version >= 33) {
        await PermissionsAndroid.requestMultiple([
          'android.permission.READ_MEDIA_AUDIO' as any,
        ])
        return true
      } else {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ])
        return granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
      }
    } catch {
      return false
    }
  }

  async getWritableDir(): Promise<string> {
    await this.requestPermissions()

    const candidates = [
      PRIMARY_DOWNLOAD_DIR,
      `${RNFS.DownloadDirectoryPath}/CJYMusic`,
      `${RNFS.ExternalDirectoryPath}/Music`,
      `${RNFS.DocumentDirectoryPath}/Music`,
    ]

    for (const dir of candidates) {
      try {
        const exists = await existsFile(dir)
        if (!exists) {
          await mkdir(dir)
        }
        // Probe writability
        const testFile = `${dir}/.probe_${Date.now()}`
        await RNFS.writeFile(testFile, 'ok', 'utf8')
        await RNFS.unlink(testFile).catch(() => {})
        this.writableDir = dir
        return dir
      } catch (err) {
        console.warn(`[Download] Candidate dir ${dir} not writable:`, err)
      }
    }

    this.writableDir = RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath
    return this.writableDir
  }

  async startDownload(
    music: { id: string; name: string; singer: string; albumName?: string; pic?: string },
    quality: 'flac' | '320k' = 'flac',
    directUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const targetDir = await this.getWritableDir()

    const ext = quality === 'flac' ? 'flac' : 'mp3'
    const cleanName = `${music.singer} - ${music.name}`.replace(/[\\/:*?"<>|]/g, '_')
    const destPath = `${targetDir}/${cleanName}.${ext}`

    return new Promise((resolve, reject) => {
      const res = downloadFile(directUrl, destPath, {
        progressDivider: 2,
        progressInterval: 250,
        progress: (p) => {
          const percent = p.contentLength > 0 ? Math.round((p.bytesWritten / p.contentLength) * 100) : 0
          if (onProgress) onProgress(percent)
        },
      })

      this.activeJobId = res.jobId

      res.promise
        .then((result) => {
          this.activeJobId = null
          if (result.statusCode === 200 || result.statusCode === 206) {
            if (music.pic) {
              const coverPath = `${targetDir}/${cleanName}.jpg`
              void downloadFile(music.pic, coverPath, {}).promise.catch(() => {})
            }
            if (Platform.OS === 'android' && (RNFS as any).scanFile) {
              ;(RNFS as any).scanFile(destPath).catch(() => {})
            }
            resolve(destPath)
          } else {
            reject(new Error(`下载失败 (HTTP ${result.statusCode})`))
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
