import { Platform, PermissionsAndroid } from 'react-native'
import RNFS from 'react-native-fs'
import { downloadFile, mkdir, existsFile } from '@/utils/fs'
import { getData, saveData } from '@/plugins/storage'

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
const CUSTOM_PATH_STORAGE_KEY = 'cjy_download_custom_dir'

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

  async testWritable(dir: string): Promise<boolean> {
    try {
      const exists = await existsFile(dir)
      if (!exists) {
        await mkdir(dir)
      }
      const testFile = `${dir}/.probe_${Date.now()}`
      await RNFS.writeFile(testFile, 'ok', 'utf8')
      await RNFS.unlink(testFile).catch(() => {})
      return true
    } catch (err) {
      return false
    }
  }

  async setCustomDir(dir: string): Promise<boolean> {
    const ok = await this.testWritable(dir)
    if (ok) {
      this.writableDir = dir
      await saveData(CUSTOM_PATH_STORAGE_KEY, dir)
      return true
    }
    return false
  }

  async getWritableDir(): Promise<string> {
    await this.requestPermissions()

    const saved = await getData<string>(CUSTOM_PATH_STORAGE_KEY).catch(() => null)
    const candidates = [
      saved,
      PRIMARY_DOWNLOAD_DIR,
      `${RNFS.DownloadDirectoryPath}/CJYMusic`,
      `${RNFS.ExternalDirectoryPath}/Music`,
      `${RNFS.DocumentDirectoryPath}/Music`,
    ].filter(Boolean) as string[]

    for (const dir of candidates) {
      const ok = await this.testWritable(dir)
      if (ok) {
        this.writableDir = dir
        return dir
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

    const cleanTitle = (music.name || 'Unknown').replace(/[/\\?%*:|"<>]/g, '_').trim()
    const cleanSinger = (music.singer || 'Unknown').replace(/[/\\?%*:|"<>]/g, '_').trim()
    const ext = quality === 'flac' ? 'flac' : 'mp3'
    const fileName = `${cleanSinger} - ${cleanTitle}.${ext}`
    const destPath = `${targetDir}/${fileName}`

    try {
      const downloadResult = downloadFile(directUrl, destPath, {
        onProgress: (p) => {
          if (onProgress && p.total > 0) {
            onProgress(p.loaded / p.total)
          }
        },
      })
      await downloadResult.promise

      if (music.pic) {
        const coverPath = `${targetDir}/${cleanSinger} - ${cleanTitle}.jpg`
        try {
          await downloadFile(music.pic, coverPath).promise
        } catch {
          // ignore cover failure
        }
      }

      if (Platform.OS === 'android') {
        try {
          await RNFS.scanFile(destPath)
        } catch {
          // ignore scan error
        }
      }

      return destPath
    } catch (err: any) {
      throw new Error(`下载落盘失败: ${err.message || '网络中断'}`)
    }
  }
}

export const downloadManager = new DownloadManager()
