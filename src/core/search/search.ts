import searchState from '@/store/search/state'
import searchActions from '@/store/search/action'
import { getSearchHistory as getSearchHistoryFromStore, saveSearchHistory } from '@/utils/data'
import settingState from '@/store/setting/state'


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

export const searchArtist = (artist?: string) => {
  if (!artist) return
  const cleanArtist = String(artist).split(/[/&,，、]/)[0].trim() || String(artist).trim()
  if (!cleanArtist) return
  if (global.state_event) {
    import('@/navigation').then(({ pop }) => {
      import('@/store/common/state').then(({ default: commonState }) => {
        if (commonState.componentIds.playDetail) {
          void pop(commonState.componentIds.playDetail)
        }
      })
    })
    import('@/core/common').then(({ setNavActiveId }) => {
      setNavActiveId('nav_search')
      setTimeout(() => {
        global.app_event.search(cleanArtist)
      }, 150)
    })
  }
}

