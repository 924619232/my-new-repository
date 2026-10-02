import { privateStorageDirectoryPath, existsFile, appendFile, unlink, writeFile, readFile, mkdir, stat, moveFile } from '@/utils/fs'

export interface LogEntry {
  time: string
  type: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  module: string
  text: string
}

const LOG_DIR = privateStorageDirectoryPath + '/logs'
const LOG_FILE = LOG_DIR + '/lx_debug.log'
const OLD_LOG_FILE = LOG_DIR + '/lx_debug.old.log'
const MAX_LOG_SIZE = 3 * 1024 * 1024 // 3MB 轮转阈值
const RING_BUFFER_SIZE = 300 // 内存常驻最新 300 条

class LogManager {
  private ringBuffer: LogEntry[] = []
  private pendingQueue: string[] = []
  private flushTimer: any = null
  private isWriting = false
  private currentFileSize = 0
  private isInitialized = false

  public async initLogFile() {
    try {
      const dirExists = await existsFile(LOG_DIR)
      if (!dirExists) {
        await mkdir(LOG_DIR)
      }

      const fileExists = await existsFile(LOG_FILE)
      if (!fileExists) {
        await writeFile(LOG_FILE, `=== LX Music Mobile [Log Edition] Session Started at ${new Date().toISOString()} ===\n`)
        this.currentFileSize = 100
      } else {
        const fileStat = await stat(LOG_FILE)
        this.currentFileSize = fileStat?.size ?? 0
      }

      this.isInitialized = true
      this.flushPending()
    } catch (err) {
      console.log('[LogManager] init failed:', err)
    }
  }

  public record(type: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', moduleOrMsg: any, ...rest: any[]) {
    let module = 'App'
    let msgs: any[] = []

    if (typeof moduleOrMsg === 'string' && moduleOrMsg.startsWith('[') && moduleOrMsg.endsWith(']')) {
      module = moduleOrMsg.slice(1, -1)
      msgs = rest
    } else if (typeof moduleOrMsg === 'string' && rest.length > 0 && /^[A-Za-z0-9_-]+$/.test(moduleOrMsg)) {
      module = moduleOrMsg
      msgs = rest
    } else {
      msgs = [moduleOrMsg, ...rest]
    }

    const text = msgs.map(m => {
      if (typeof m === 'string') return m
      if (m instanceof Error) return m.stack ?? `${m.name}: ${m.message}`
      try {
        return JSON.stringify(m)
      } catch {
        return String(m)
      }
    }).join(' ')

    const now = new Date()
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ` +
                    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.` +
                    `${String(now.getMilliseconds()).padStart(3, '0')}`

    const entry: LogEntry = {
      time: timeStr,
      type,
      module,
      text,
    }

    // 1. 塞入内存环形队列 (RingBuffer)
    if (this.ringBuffer.length >= RING_BUFFER_SIZE) {
      this.ringBuffer.shift()
    }
    this.ringBuffer.push(entry)

    // 2. 格式化日志文本行
    const line = `[${timeStr}] [${module}] [${type}] ${text}`

    // 3. 同时输出到 Console
    if (type === 'ERROR') {
      console.error(line)
    } else if (type === 'WARN') {
      console.warn(line)
    } else {
      console.log(line)
    }

    // 4. 塞入待落盘异步缓冲
    this.pendingQueue.push(line)
    if (this.pendingQueue.length >= 20) {
      void this.flushPending()
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null
        void this.flushPending()
      }, 500)
    }
  }

  private async checkAndRotate() {
    if (this.currentFileSize >= MAX_LOG_SIZE) {
      try {
        const oldExists = await existsFile(OLD_LOG_FILE)
        if (oldExists) {
          await unlink(OLD_LOG_FILE)
        }
        await moveFile(LOG_FILE, OLD_LOG_FILE)
        await writeFile(LOG_FILE, `=== LX Music Mobile [Log Edition] Rotated at ${new Date().toISOString()} ===\n`)
        this.currentFileSize = 100
      } catch (e) {
        console.warn('[LogManager] rotate error:', e)
      }
    }
  }

  private async flushPending() {
    if (!this.isInitialized || this.isWriting || this.pendingQueue.length === 0) return
    this.isWriting = true
    const batch = this.pendingQueue.splice(0, this.pendingQueue.length)
    const payload = batch.join('\n') + '\n'

    try {
      await this.checkAndRotate()
      await appendFile(LOG_FILE, payload)
      this.currentFileSize += payload.length
    } catch (err) {
      console.warn('[LogManager] appendFile error:', err)
      // 若写入失败，适度放回待写队列前端
      if (this.pendingQueue.length < 200) {
        this.pendingQueue.unshift(...batch)
      }
    } finally {
      this.isWriting = false
      if (this.pendingQueue.length > 0) {
        setTimeout(() => void this.flushPending(), 200)
      }
    }
  }

  public getRecentMemoryLogs(): LogEntry[] {
    return [...this.ringBuffer]
  }

  public async getFullLogs(): Promise<string> {
    try {
      let content = ''
      const oldExists = await existsFile(OLD_LOG_FILE)
      if (oldExists) {
        content += await readFile(OLD_LOG_FILE) + '\n--- Log Rotation Boundary ---\n'
      }
      const curExists = await existsFile(LOG_FILE)
      if (curExists) {
        content += await readFile(LOG_FILE)
      }
      return content || (this.ringBuffer.map(e => `[${e.time}] [${e.module}] [${e.type}] ${e.text}`).join('\n'))
    } catch (e: any) {
      return `Failed to read logs: ${e.message}\n` + this.ringBuffer.map(e => `[${e.time}] [${e.module}] [${e.type}] ${e.text}`).join('\n')
    }
  }

  public async clearAllLogs(): Promise<void> {
    this.ringBuffer = []
    this.pendingQueue = []
    this.currentFileSize = 0
    try {
      const curExists = await existsFile(LOG_FILE)
      if (curExists) await unlink(LOG_FILE)
      const oldExists = await existsFile(OLD_LOG_FILE)
      if (oldExists) await unlink(OLD_LOG_FILE)
      await writeFile(LOG_FILE, `=== LX Music Mobile [Log Edition] Cleared at ${new Date().toISOString()} ===\n`)
      this.currentFileSize = 100
    } catch (e) {
      console.warn('[LogManager] clear error:', e)
    }
  }

  public getLogFilePath(): string {
    return LOG_FILE
  }
}

const manager = new LogManager()

export const init = async() => {
  return manager.initLogFile()
}

export const getLogs = async() => {
  return manager.getFullLogs()
}

export const getRecentLogs = () => {
  return manager.getRecentMemoryLogs()
}

export const clearLogs = async() => {
  return manager.clearAllLogs()
}

export const getLogFilePath = () => {
  return manager.getLogFilePath()
}

export const log = {
  debug(moduleOrMsg: any, ...msgs: any[]) {
    manager.record('DEBUG', moduleOrMsg, ...msgs)
  },
  info(moduleOrMsg: any, ...msgs: any[]) {
    manager.record('INFO', moduleOrMsg, ...msgs)
  },
  warn(moduleOrMsg: any, ...msgs: any[]) {
    manager.record('WARN', moduleOrMsg, ...msgs)
  },
  error(moduleOrMsg: any, ...msgs: any[]) {
    manager.record('ERROR', moduleOrMsg, ...msgs)
  },
}
