import searchState from '@/store/search/state'
import searchActions from '@/store/search/action'
import { getSearchHistory as getSearchHistoryFromStore, saveSearchHistory } from '@/utils/data'
import settingState from '@/store/setting/state'
import { pushArtistDetailScreen } from '@/navigation/navigation'
import commonState from '@/store/common/state'


export const setSearchType: typeof searchActions['setSearchType'] = (type) => {
  searchActions.setSearchType(type)
}
export const setSearchText: typeof searchActions['setSearchText'] = (text) => {
  searchActions.setSearchText(text)
}
export const setTipListInfo: typeof searchActions['setTipListInfo'] = (text, source) => {
  searchActions.setTipListInfo(text, source)
}
export const setTipList: typeof searchActions['setTipList'] = (list) => {
  searchActions.setTipList(list)
}

export const getSearchHistory = async() => {
  if (!searchState.historyList.length) searchActions.setHistoryWord(await getSearchHistoryFromStore())
  return searchState.historyList
}
export const addHistoryWord = async(word: string) => {
  if (!settingState.setting['search.isShowHistorySearch'] || !word) return
  if (!searchState.historyList.length) searchActions.setHistoryWord(await getSearchHistoryFromStore())
  const list = searchActions.addHistoryWord(word)
  if (!list) return
  void saveSearchHistory(list)
}
export const removeHistoryWord = (index: number) => {
  const list = searchActions.removeHistoryWord(index)
  void saveSearchHistory(list)
}
export const clearHistoryList = () => {
  const list = searchActions.clearHistoryList()
  void saveSearchHistory(list)
}

export const searchArtist = (artist?: string, avatarUrl?: string) => {
  if (!artist) return
  const cleanArtist = String(artist).split(/[/&,，、]/)[0].trim() || String(artist).trim()
  if (!cleanArtist) return

  const targetComponentId = commonState.componentIds.songlistDetail || commonState.componentIds.playDetail || commonState.componentIds.home
  if (targetComponentId) {
    pushArtistDetailScreen(targetComponentId, cleanArtist, avatarUrl)
  }
}


