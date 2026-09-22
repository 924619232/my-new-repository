import { useRef, useEffect } from 'react'
import { type LayoutChangeEvent, View } from 'react-native'
import searchState, { type SearchType } from '@/store/search/state'
import { getSearchSetting, saveSearchSetting } from '@/utils/data'
import { createStyle } from '@/utils/tools'
import TipList, { type TipListType } from './TipList'
import List, { type ListType } from './List'
import { addHistoryWord } from '@/core/search/search'

interface SearchInfo {
  temp_source: LX.OnlineSource
  source: LX.OnlineSource | 'all'
  searchType: 'music' | 'songlist'
}

export default () => {
  const searchTipListRef = useRef<TipListType>(null)
  const listRef = useRef<ListType>(null)
  const layoutHeightRef = useRef<number>(0)
  const searchInfo = useRef<SearchInfo>({ temp_source: 'kw', source: 'kw', searchType: 'music' })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    void getSearchSetting().then(info => {
      searchInfo.current.temp_source = info.temp_source
      searchInfo.current.source = info.source
      searchInfo.current.searchType = info.type
      if (searchState.searchText) {
        listRef.current?.loadList(searchState.searchText, searchInfo.current.source, searchInfo.current.searchType)
      }
    })

    const handleTypeChange = (type: SearchType) => {
      searchInfo.current.searchType = type
      void saveSearchSetting({ type })
      listRef.current?.loadList(searchState.searchText, searchInfo.current.source, type)
    }
    const onSearchEvent = (text: string) => {
      handleSearch(text)
    }
    const onTipSearchEvent = (text: string) => {
      handleTipSearch(text)
    }

    global.app_event.on('searchTypeChanged', handleTypeChange)
    global.app_event.on('search', onSearchEvent)
    global.app_event.on('tipSearch', onTipSearchEvent)

    return () => {
      global.app_event.off('searchTypeChanged', handleTypeChange)
      global.app_event.off('search', onSearchEvent)
      global.app_event.off('tipSearch', onTipSearchEvent)
    }
  }, [])

  const handleLayout = (e: LayoutChangeEvent) => {
    layoutHeightRef.current = e.nativeEvent.layout.height
  }

  const handleTipSearch = (text: string) => {
    if (!text) {
      handleHideTipList()
      return
    }
    setTimeout(() => {
      searchTipListRef.current?.search(text, layoutHeightRef.current)
    }, 300)
  }

  const handleHideTipList = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    searchTipListRef.current?.hide()
  }

  const handleSearch = (text: string) => {
    handleHideTipList()
    searchTipListRef.current?.search(text, layoutHeightRef.current)
    void addHistoryWord(text)
    listRef.current?.loadList(text, searchInfo.current.source, searchInfo.current.searchType)
  }

  return (
    <View style={styles.container}>
      <View style={styles.content} onLayout={handleLayout}>
        <TipList ref={searchTipListRef} onSearch={handleSearch} />
        <List ref={listRef} onSearch={handleSearch} />
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
  },
  content: {
    flex: 1,
  },
})
