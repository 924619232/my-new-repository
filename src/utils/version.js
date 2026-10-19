import { httpGet } from '@/utils/request'
import { author, name } from '../../package.json'
import { downloadFile, stopDownload, temporaryDirectoryPath, unlink } from '@/utils/fs'
import { getSupportedAbis, installApk } from '@/utils/nativeModules/utils'
import { APP_PROVIDER_NAME } from '@/config/constant'

const abis = [
  'arm64-v8a',
  'armeabi-v7a',
  'x86_64',
  'x86',
  'universal',
]

let latestVersionInfo = null

const address = [
  // 🛡️【国内 100% 免翻墙直连双保险】：
  // 1. 国内直接直连源（无需跳转、无被墙风险）
  ['http://35.212.238.161/mt_helper/apps/version.json', 'direct'],
  // 2. 中国移动云盘原生直链（已支持 302 自动重定向追踪）
  ['https://pan.cjy.qzz.io/d/%E7%A7%BB%E5%8A%A8%E4%BA%91%E7%9B%98/apps/version.json', 'direct'],
  // 3. 国内可用 jsdelivr 镜像
  ['https://testingcf.jsdelivr.net/gh/924619232/my-new-repository@main/version.json', 'direct'],
  ['https://cdn.jsdelivr.net/gh/924619232/my-new-repository@main/version.json', 'direct'],
  // 4. 海外备用源
  ['https://music.cjy.qzz.io/apps/version.json', 'direct'],
  ['https://pan.cjy.qzz.io/d/local/apps/version.json', 'direct'],
]


const request = async(url, retryNum = 0, redirectCount = 0) => {
  return new Promise((resolve, reject) => {
    httpGet(url, {
      timeout: 5000,
    }, (err, resp, body) => {
      if (err) {
        ++retryNum >= 1
          ? reject(err)
          : request(url, retryNum, redirectCount).then(resolve).catch(reject)
        return
      }

      // 🛡️ 彻底攻克中国移动云盘/AList/对象存储 301/302 重定向直接报错断链的死穴！
      if ((resp.statusCode === 301 || resp.statusCode === 302 || resp.statusCode === 307 || resp.statusCode === 308) && redirectCount < 5) {
        const location = resp.headers?.location || resp.headers?.Location
        if (location) {
          const nextUrl = location.startsWith('http') ? location : new URL(location, url).href
          return request(nextUrl, 0, redirectCount + 1).then(resolve).catch(reject)
        }
      }

      if (resp.statusCode != 200) {
        ++retryNum >= 1
          ? reject(new Error(resp.statusMessage || String(resp.statusCode)))
          : request(url, retryNum, redirectCount).then(resolve).catch(reject)
      } else {
        resolve(body)
      }
    })
  })
}

const getDirectInfo = async(url) => {
  const cacheBusterUrl = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`
  return request(cacheBusterUrl).then(info => {
    let parsedInfo = info
    if (typeof parsedInfo === 'string') {
      try {
        parsedInfo = JSON.parse(parsedInfo)
      } catch (e) {
        throw new Error('failed')
      }
    }
    if (!parsedInfo || parsedInfo.version == null) throw new Error('failed')
    return parsedInfo
  })
}

const getNpmPkgInfo = async(url) => {
  return request(url).then(json => {
    if (!json.versionInfo) throw new Error('failed')
    const info = JSON.parse(json.versionInfo)
    if (info.version == null) throw new Error('failed')
    return info
  })
}

export const getVersionInfo = async(index = 0) => {
  const [url, source] = address[index]
  let promise
  switch (source) {
    case 'direct':
      promise = getDirectInfo(url)
      break
    case 'npm':
      promise = getNpmPkgInfo(url)
      break
  }

  return promise.then(info => {
    latestVersionInfo = info
    return info
  }).catch(async(err) => {
    index++
    if (index >= address.length) throw err
    return getVersionInfo(index)
  })
}

const getTargetAbi = async() => {
  const supportedAbis = await getSupportedAbis()
  for (const abi of abis) {
    if (supportedAbis.includes(abi)) return abi
  }
  return abis[abis.length - 1]
}
let downloadJobId = null
const noop = (total, download) => {}
let apkSavePath

export const downloadNewVersion = async(version, onDownload = noop) => {
  const url = (latestVersionInfo && latestVersionInfo.downloadUrl) || 'https://music.cjy.qzz.io/apps/lx-music-cjy-release.apk'
  let savePath = temporaryDirectoryPath + '/lx-music-mobile.apk'

  if (downloadJobId) stopDownload(downloadJobId)

  try {
    await unlink(savePath)
  } catch (e) {}

  const { jobId, promise } = downloadFile(url, savePath, {
    progressInterval: 500,
    connectionTimeout: 20000,
    readTimeout: 30000,
    begin({ statusCode, contentLength }) {
      onDownload(contentLength, 0)
    },
    progress({ contentLength, bytesWritten }) {
      onDownload(contentLength, bytesWritten)
    },
  })
  downloadJobId = jobId
  return promise.then((res) => {
    if (res && res.statusCode && res.statusCode >= 400) {
      throw new Error(`Download failed with status: ${res.statusCode}`)
    }
    apkSavePath = savePath
    return updateApp()
  })
}

export const updateApp = async() => {
  if (!apkSavePath) throw new Error('apk Save Path is null')
  await installApk(apkSavePath, APP_PROVIDER_NAME)
}
