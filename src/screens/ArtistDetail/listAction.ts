// -*- coding: utf-8 -*-
import { LIST_IDS } from '@/config/constant'
import { setActiveList, setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import listState from '@/store/list/state'

let playTaskId = 0

/**
 * 歌手专页歌曲播放与列表调度中心
 * 1. 拥有完全独立的 listId 命名空间 (artist__${artist})，彻底杜绝与搜索列表 search__ 发生串台互踩；
 * 2. 状态幂等防重：若当前正在播放的就是该歌手列表，点击切歌直接 0ms 调用 playList，避免重复全量写库引发后台挂起与切歌失败。
 */
export const handlePlayArtistSong = async(artist: string, list: LX.Music.MusicInfoOnline[], index = 0) => {
  const currentTaskId = ++playTaskId
  if (!list || !list.length) return

  const listId = `artist__${artist}`

  // 若当前临时列表已绑定该歌手且正处于激活态，直接按序号秒播，无需重复覆写
  if (listState.tempListMeta.id === listId && listState.activeListId === LIST_IDS.TEMP) {
    await playList(LIST_IDS.TEMP, index)
    return
  }

  await setTempList(listId, [...list])
  if (currentTaskId !== playTaskId) return

  setActiveList(LIST_IDS.TEMP)
  await playList(LIST_IDS.TEMP, index)
}
