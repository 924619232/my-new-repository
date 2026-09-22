import { dateFormat } from './common'
import he from 'he'

export { tranditionalize as langS2T } from '@/utils/simplify-chinese-main'

export * from './common'

// https://stackoverflow.com/a/53387532
export function compareVer(currentVer: string, targetVer: string): -1 | 0 | 1 {
  // treat non-numerical characters as lower version
  // replacing them with a negative number based on charcode of each character
  const fix = (s: string) => `.${s.toLowerCase().charCodeAt(0) - 2147483647}.`

  const currentVerArr: Array<string | number> = ('' + currentVer).replace(/[^0-9.]/g, fix).split('.')
  const targetVerArr: Array<string | number> = ('' + targetVer).replace(/[^0-9.]/g, fix).split('.')
  let c = Math.max(currentVerArr.length, targetVerArr.length)
  for (let i = 0; i < c; i++) {
    // convert to integer the most efficient way
    currentVerArr[i] = ~~currentVerArr[i]
    targetVerArr[i] = ~~targetVerArr[i]
    if (currentVerArr[i] > targetVerArr[i]) return 1
    else if (currentVerArr[i] < targetVerArr[i]) return -1
  }
  return 0
}


export const toNewMusicInfo = (oldMusicInfo: any): LX.Music.MusicInfo => {
  if (!oldMusicInfo) return oldMusicInfo
  if (oldMusicInfo.meta && (oldMusicInfo.meta._qualitys != null || oldMusicInfo.meta.songId != null || oldMusicInfo.source == 'local')) {
    return oldMusicInfo
  }
  const songmid = oldMusicInfo.songmid ?? oldMusicInfo.meta?.songId ?? oldMusicInfo.id ?? ''
  const meta: Record<string, any> = {
    songId: songmid, // 歌曲ID，local为文件路径
    albumName: oldMusicInfo.albumName ?? oldMusicInfo.meta?.albumName ?? '', // 歌曲专辑名称
    picUrl: oldMusicInfo.img ?? oldMusicInfo.meta?.picUrl ?? '', // 歌曲图片链接
  }
  const source = oldMusicInfo.source ?? 'tx'
  const newInfo: any = {
    id: `${source}_${songmid}`,
    name: oldMusicInfo.name ?? '',
    singer: oldMusicInfo.singer ?? '',
    source,
    interval: oldMusicInfo.interval ?? '',
    meta: meta as LX.Music.MusicInfoOnline['meta'],
  }

  if (source == 'local') {
    meta.filePath = oldMusicInfo.filePath ?? songmid
    meta.ext = oldMusicInfo.ext ?? /\.(\w+)$/.exec(meta.filePath as string)?.[1] ?? ''
  } else {
    meta.qualitys = oldMusicInfo.types ?? oldMusicInfo.meta?.qualitys ?? []
    meta._qualitys = oldMusicInfo._types ?? oldMusicInfo.meta?._qualitys ?? {}
    meta.albumId = oldMusicInfo.albumId ?? oldMusicInfo.meta?.albumId ?? ''
    if (meta._qualitys?.flac32bit && !meta._qualitys.flac24bit) {
      meta._qualitys.flac24bit = meta._qualitys.flac32bit
      delete meta._qualitys.flac32bit

      meta.qualitys = (meta.qualitys as any[]).map(quality => {
        if (quality.type == 'flac32bit') quality.type = 'flac24bit'
        return quality
      })
    }

    switch (source) {
      case 'kg':
        meta.hash = oldMusicInfo.hash ?? oldMusicInfo.meta?.hash ?? ''
        newInfo.id = (songmid ? `${songmid}_` : '') + (meta.hash || '')
        break
      case 'tx':
        meta.strMediaMid = oldMusicInfo.strMediaMid ?? oldMusicInfo.meta?.strMediaMid ?? ''
        meta.albumMid = oldMusicInfo.albumMid ?? oldMusicInfo.meta?.albumMid ?? ''
        meta.id = oldMusicInfo.songId ?? oldMusicInfo.meta?.id ?? songmid
        break
      case 'mg':
        meta.copyrightId = oldMusicInfo.copyrightId ?? oldMusicInfo.meta?.copyrightId ?? ''
        meta.lrcUrl = oldMusicInfo.lrcUrl ?? oldMusicInfo.meta?.lrcUrl ?? ''
        meta.mrcUrl = oldMusicInfo.mrcUrl ?? oldMusicInfo.meta?.mrcUrl ?? ''
        meta.trcUrl = oldMusicInfo.trcUrl ?? oldMusicInfo.meta?.trcUrl ?? ''
        break
    }
  }

  return newInfo
}

export const toOldMusicInfo = (minfo: any): any => {
  if (!minfo) return {}
  if (!minfo.meta) return minfo
  const meta = minfo.meta || {}
  const oInfo: Record<string, any> = {
    name: minfo.name ?? '',
    singer: minfo.singer ?? '',
    source: minfo.source,
    songmid: meta.songId ?? minfo.id,
    interval: minfo.interval ?? '',
    albumName: meta.albumName ?? '',
    img: meta.picUrl ?? '',
    typeUrl: {},
  }
  if (minfo.source == 'local') {
    oInfo.filePath = meta.filePath ?? ''
    oInfo.ext = meta.ext ?? ''
    oInfo.albumId = ''
    oInfo.types = []
    oInfo._types = {}
  } else {
    oInfo.albumId = meta.albumId ?? ''
    oInfo.types = meta.qualitys ?? []
    oInfo._types = meta._qualitys ?? {}

    switch (minfo.source) {
      case 'kg':
        oInfo.hash = meta.hash
        break
      case 'tx':
        oInfo.strMediaMid = meta.strMediaMid
        oInfo.albumMid = meta.albumMid
        oInfo.songId = meta.id ?? meta.songId
        break
      case 'mg':
        oInfo.copyrightId = meta.copyrightId
        oInfo.lrcUrl = meta.lrcUrl
        oInfo.mrcUrl = meta.mrcUrl
        oInfo.trcUrl = meta.trcUrl
        break
    }
  }

  return oInfo
}

/**
 * 修复2.0.0-dev.8之前的新列表数据音质
 * @param musicInfo
 */
export const fixNewMusicInfoQuality = (musicInfo: LX.Music.MusicInfo) => {
  if (!musicInfo || musicInfo.source == 'local') return musicInfo
  if (!musicInfo.meta?._qualitys) return musicInfo

  // @ts-expect-error
  if (musicInfo.meta._qualitys.flac32bit && !musicInfo.meta._qualitys.flac24bit) {
    // @ts-expect-error
    musicInfo.meta._qualitys.flac24bit = musicInfo.meta._qualitys.flac32bit
    // @ts-expect-error
    delete musicInfo.meta._qualitys.flac32bit

    musicInfo.meta.qualitys = musicInfo.meta.qualitys?.map(quality => {
      // @ts-expect-error
      if (quality.type == 'flac32bit') quality.type = 'flac24bit'
      return quality
    }) ?? []
  }

  return musicInfo
}


export const filterMusicList = <T extends LX.Music.MusicInfo>(list: T[]): T[] => {
  const ids = new Set<string>()
  return list.filter(s => {
    if (!s.id || ids.has(s.id) || !s.name) return false
    if (s.singer == null) s.singer = ''
    ids.add(s.id)
    return true
  })
}


export const deduplicationList = <T extends LX.Music.MusicInfo>(list: T[]): T[] => {
  const ids = new Set<string>()
  return list.filter(s => {
    if (ids.has(s.id)) return false
    ids.add(s.id)
    return true
  })
}


/**
 * 时间格式化
 */
export const dateFormat2 = (time: number): string => {
  let differ = Math.trunc((Date.now() - time) / 1000)
  if (differ < 60) {
    return global.i18n.t('date_format_second', { num: differ })
  } else if (differ < 3600) {
    return global.i18n.t('date_format_minute', { num: Math.trunc(differ / 60) })
  } else if (differ < 86400) {
    return global.i18n.t('date_format_hour', { num: Math.trunc(differ / 3600) })
  } else {
    return dateFormat(time)
  }
}

/**
 * 格式化播放数量
 * @param {*} num 数字
 */
export const formatPlayCount = (num: number): string => {
  if (num > 100000000) return `${Math.trunc(num / 10000000) / 10}亿`
  if (num > 10000) return `${Math.trunc(num / 1000) / 10}万`
  return String(num)
}

export const decodeName = (str: string | null = '') => {
  if (!str) return ''
  return he.decode(str)
}
