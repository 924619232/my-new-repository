import { Platform, PermissionsAndroid } from 'react-native'
import RNFS from 'react-native-fs'
import { downloadFile, mkdir, existsFile, unlink } from '@/utils/fs'
import { getData, saveData } from '@/plugins/storage'
import { getMusicUrl, getPicUrl } from '@/core/music/online'
import { createUserList, addListMusics } from '@/core/list'
import listState from '@/store/list/state'
import { toast } from '@/utils/tools'

export interface DownloadTaskItem {
  id: string
  name: string
  singer: string
  albumName?: string
  pic?: string
  quality: 'flac' | '320k' | '128k'
  progress: number // 0 to 100
  speed?: string
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused'
  savedPath?: string
  fileSize?: string
  error?: string
  musicInfo: LX.Music.MusicInfoOnline
  createdAt: number
}

const PRIMARY_DOWNLOAD_DIR = '/storage/emulated/0/Music/CJYMusic'
const CUSTOM_PATH_STORAGE_KEY = 'cjy_download_custom_dir'
const TASKS_STORAGE_KEY = 'cjy_download_tasks_v2'
const MAX_CONCURRENT = 3
export const OFFLINE_LIST_ID = 'userlist_download'

type Listener = (tasks: DownloadTaskItem[]) => void

class DownloadManager {
  private writableDir: string = PRIMARY_DOWNLOAD_DIR
  private tasks: DownloadTaskItem[] = []
  private activeJobs = new Map<string, { cancel: () => void }>()
  private listeners: Listener[] = []
  private isProcessing = false
  private inited = false

  constructor() {
    void this.init()
  }

  async init() {
    if (this.inited) return
    this.inited = true
    try {
      const savedTasks = await getData<DownloadTaskItem[]>(TASKS_STORAGE_KEY).catch(() => null)
      if (Array.isArray(savedTasks)) {
        this.tasks = savedTasks.map(t => {
          if (t.status === 'downloading') {
            return { ...t, status: 'pending', progress: 0 }
          }
          return t
        })
      }
    } catch {}
    this.processQueue()
  }

  private async persistTasks() {
    try {
      await saveData(TASKS_STORAGE_KEY, this.tasks)
    } catch {}
  }

  private notify() {
    const list = [...this.tasks]
    for (const listener of this.listeners) {
      try {
        listener(list)
      } catch {}
    }
  }

  addListener(listener: Listener) {
    this.listeners.push(listener)
    listener([...this.tasks])
  }

  removeListener(listener: Listener) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

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
      await unlink(testFile).catch(() => {})
      return true
    } catch {
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

  getTasks(): DownloadTaskItem[] {
    return [...this.tasks]
  }

  getDownloadingTasks(): DownloadTaskItem[] {
    return this.tasks.filter(t => t.status === 'downloading' || t.status === 'pending' || t.status === 'paused')
  }

  getCompletedTasks(): DownloadTaskItem[] {
    return this.tasks.filter(t => t.status === 'completed')
  }

  /**
   * 批量将音乐添加至下载队列
   */
  async addBatch(musicInfos: LX.Music.MusicInfoOnline[], quality: 'flac' | '320k' = 'flac'): Promise<number> {
    let addedCount = 0
    for (const music of musicInfos) {
      const existing = this.tasks.find(t => t.id === String(music.id))
      if (existing) {
        if (existing.status === 'error' || existing.status === 'paused') {
          existing.status = 'pending'
          existing.progress = 0
          existing.error = undefined
          addedCount++
        }
        continue
      }

      const task: DownloadTaskItem = {
        id: String(music.id),
        name: music.name,
        singer: music.singer,
        albumName: music.meta?.albumName,
        pic: music.meta?.picUrl || (music as any).pic_url || (music as any).img,
        quality,
        progress: 0,
        status: 'pending',
        musicInfo: music,
        createdAt: Date.now(),
      }
      this.tasks.unshift(task)
      addedCount++
    }

    if (addedCount > 0) {
      await this.persistTasks()
      this.notify()
      this.processQueue()
    }

    return addedCount
  }

  /**
   * 调度执行下载队列（最大并发 3）
   */
  private processQueue() {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      const activeCount = this.tasks.filter(t => t.status === 'downloading').length
      const slots = MAX_CONCURRENT - activeCount

      if (slots <= 0) return

      const pendingTasks = this.tasks.filter(t => t.status === 'pending').slice(0, slots)
      for (const task of pendingTasks) {
        void this.executeTask(task)
      }
    } finally {
      this.isProcessing = false
    }
  }

  private async executeTask(task: DownloadTaskItem) {
    task.status = 'downloading'
    task.progress = 0
    task.error = undefined
    this.notify()
    await this.persistTasks()

    try {
      // 1. 解析真实音频下载直链 (FLAC -> 320k)
      let directUrl = ''
      let actualQuality: 'flac' | '320k' = task.quality
      try {
        directUrl = await getMusicUrl({
          musicInfo: task.musicInfo,
          quality: task.quality,
          isRefresh: true,
        })
      } catch {
        if (task.quality === 'flac') {
          try {
            directUrl = await getMusicUrl({
              musicInfo: task.musicInfo,
              quality: '320k',
              isRefresh: true,
            })
            actualQuality = '320k'
          } catch {}
        }
      }

      if (!directUrl) {
        throw new Error('未解析到可用音频直链')
      }

      // 2. 准备封面
      if (!task.pic) {
        try {
          task.pic = await getPicUrl({ musicInfo: task.musicInfo, isRefresh: false })
        } catch {}
      }

      // 3. 准备目标磁盘文件
      const targetDir = await this.getWritableDir()
      const cleanTitle = (task.name || 'Unknown').replace(/[/\\?%*:|"<>]/g, '_').trim()
      const cleanSinger = (task.singer || 'Unknown').replace(/[/\\?%*:|"<>]/g, '_').trim()
      const ext = actualQuality === 'flac' ? 'flac' : 'mp3'
      const fileName = `${cleanSinger} - ${cleanTitle}.${ext}`
      const destPath = `${targetDir}/${fileName}`

      // 4. 发起下载
      const downloadJob = downloadFile(directUrl, destPath, {
        progressInterval: 250,
        progress: (p) => {
          if (p.contentLength > 0) {
            const pct = Math.floor((p.bytesWritten / p.contentLength) * 100)
            if (task.progress !== pct) {
              task.progress = pct
              this.notify()
            }
          }
        },
      })

      this.activeJobs.set(task.id, {
        cancel: () => {
          try {
            RNFS.stopDownload(downloadJob.jobId)
          } catch {}
        },
      })

      await downloadJob.promise
      this.activeJobs.delete(task.id)

      // 5. 下载封面
      if (task.pic) {
        const coverPath = `${targetDir}/${cleanSinger} - ${cleanTitle}.jpg`
        try {
          await downloadFile(task.pic, coverPath).promise
        } catch {}
      }

      // 6. 获取文件大小
      let fileSizeStr = ''
      try {
        const statRes = await RNFS.stat(destPath)
        const sizeMb = (Number(statRes.size) / (1024 * 1024)).toFixed(1)
        fileSizeStr = `${sizeMb} MB`
      } catch {}

      // 7. 扫描加入系统媒体库
      if (Platform.OS === 'android') {
        try {
          await RNFS.scanFile(destPath)
        } catch {}
      }

      // 8. 标记完成
      task.status = 'completed'
      task.progress = 100
      task.savedPath = destPath
      task.fileSize = fileSizeStr
      task.quality = actualQuality

      // 9. 自动注册到【离线下载】歌单
      await this.registerToOfflineList(task, destPath, ext)

      toast(`下载完成: ${task.name}`)
    } catch (err: any) {
      this.activeJobs.delete(task.id)
      if (task.status !== 'paused') {
        task.status = 'error'
        task.error = err.message || '下载中断'
      }
    } finally {
      this.notify()
      await this.persistTasks()
      this.processQueue()
    }
  }

  /**
   * 将完成下载的歌曲无缝同步为 source: 'local' 的离线曲目
   */
  private async registerToOfflineList(task: DownloadTaskItem, destPath: string, ext: string) {
    try {
      const exists = listState.userList.some(l => l.id === OFFLINE_LIST_ID)
      if (!exists) {
        await createUserList(0, [
          { id: OFFLINE_LIST_ID, name: '📥 离线下载', locationUpdateTime: Date.now() },
        ])
      }

      const localSong: LX.Music.MusicInfoLocal = {
        id: `local_${task.id}`,
        name: task.name,
        singer: task.singer,
        source: 'local',
        interval: task.musicInfo.interval || '03:30',
        meta: {
          songId: destPath,
          filePath: destPath,
          ext,
          albumName: task.albumName || '离线曲目',
          picUrl: task.pic || null,
        },
      }

      await addListMusics(OFFLINE_LIST_ID, [localSong], 'top')
    } catch (err) {
      console.log('[registerToOfflineList error]', err)
    }
  }

  cancelTask(taskId: string) {
    const job = this.activeJobs.get(taskId)
    if (job) {
      job.cancel()
      this.activeJobs.delete(taskId)
    }
    this.tasks = this.tasks.filter(t => t.id !== taskId)
    this.notify()
    void this.persistTasks()
    this.processQueue()
  }

  pauseTask(taskId: string) {
    const task = this.tasks.find(t => t.id === taskId)
    if (task && task.status === 'downloading') {
      const job = this.activeJobs.get(taskId)
      if (job) {
        job.cancel()
        this.activeJobs.delete(taskId)
      }
      task.status = 'paused'
      this.notify()
      void this.persistTasks()
      this.processQueue()
    }
  }

  resumeTask(taskId: string) {
    const task = this.tasks.find(t => t.id === taskId)
    if (task && (task.status === 'paused' || task.status === 'error')) {
      task.status = 'pending'
      task.progress = 0
      task.error = undefined
      this.notify()
      void this.persistTasks()
      this.processQueue()
    }
  }

  deleteTask(taskId: string, deleteFile = true) {
    const task = this.tasks.find(t => t.id === taskId)
    if (task) {
      if (deleteFile && task.savedPath) {
        void unlink(task.savedPath).catch(() => {})
      }
      this.tasks = this.tasks.filter(t => t.id !== taskId)
      this.notify()
      void this.persistTasks()
    }
  }

  clearCompleted() {
    this.tasks = this.tasks.filter(t => t.status !== 'completed')
    this.notify()
    void this.persistTasks()
  }
}

export const downloadManager = new DownloadManager()
export default downloadManager
