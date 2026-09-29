import { LIST_IDS } from '@/config/constant'
import { setActiveList, setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import searchMusicState from '@/store/search/music/state'

let playTaskId = 0

export const handlePlay = async(list?: LX.Music.MusicInfoOnline[], index = 0) => {
  const currentTaskId = ++playTaskId
  const currentList = list || searchMusicState.listInfos[searchMusicState.source]?.list || []
  if (!currentList.length) return
  if (currentTaskId !== playTaskId) return

  const listId = `search__${searchMusicState.source}__${searchMusicState.searchText}`
  await setTempList(listId, [...currentList])
  setActiveList(LIST_IDS.TEMP)
  await playList(LIST_IDS.TEMP, index)
}
