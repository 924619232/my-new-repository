import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import { search } from '@/core/search/music'
import searchMusicState, { type Source } from '@/store/search/music/state'
import { handlePlay } from './listAction'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { BorderWidths } from '@/theme'
import { toast } from '@/utils/tools'

export interface MusicListType {
  loadList: (text: string, source: Source) => void
}

const PlayAllHeader = ({ onPlayAll, count }: { onPlayAll: () => void, count: number }) => {
  const theme = useTheme()
  if (count <= 0) return null
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: BorderWidths.normal,
      borderBottomColor: theme['c-border-background'],
    }}>
      <Text size={12} color={theme['c-font-label']}>搜索结果 (共 {count} 首)</Text>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.isDark ? 'rgba(7, 197, 86, 0.15)' : 'rgba(7, 197, 86, 0.1)',
          borderColor: theme['c-primary'],
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}
        onPress={onPlayAll}
        activeOpacity={0.7}
      >
        <Icon name="play" size={11} color={theme['c-primary']} />
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme['c-primary'], marginLeft: 4 }}>
          播放全部
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default forwardRef<MusicListType, {}>((props, ref) => {
  const listRef = useRef<OnlineListType>(null)
  const searchInfoRef = useRef<{ text: string, source: Source }>({ text: '', source: 'kw' })
  const isUnmountedRef = useRef(false)
  const [songCount, setSongCount] = useState(0)

  useImperativeHandle(ref, () => ({
    async loadList(text, source) {
      listRef.current?.setList([], false, source == 'all')
      setSongCount(0)
      if (searchMusicState.searchText == text && searchMusicState.source == source && searchMusicState.listInfos[searchMusicState.source]!.list.length) {
        requestAnimationFrame(() => {
          const list = searchMusicState.listInfos[searchMusicState.source]!.list
          listRef.current?.setList(list, false, source == 'all')
          setSongCount(list.length)
        })
      } else {
        listRef.current?.setStatus('loading')
        const page = 1
        searchInfoRef.current.text = text
        searchInfoRef.current.source = source
        return search(text, page, source).then((list) => {
          if (isUnmountedRef.current) return
          requestAnimationFrame(() => {
            listRef.current?.setList(list, false, source == 'all')
            setSongCount(list.length)
            listRef.current?.setStatus(searchMusicState.listInfos[searchMusicState.source]!.maxPage <= page ? 'end' : 'idle')
          })
        }).catch(() => {
          listRef.current?.setStatus('error')
        })
      }
    },
  }), [])

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  const handlePlayList: OnlineListProps['onPlayList'] = (index) => {
    const list = searchMusicState.listInfos[searchMusicState.source]?.list ?? []
    if (!list.length) return
    void handlePlay(list, index)
  }

  const handlePlayAll = () => {
    const list = searchMusicState.listInfos[searchMusicState.source]?.list ?? []
    if (!list.length) {
      toast('暂无可播放的搜索结果')
      return
    }
    toast('已开始播放全部搜索结果')
    void handlePlay(list, 0)
  }

  const handleRefresh: OnlineListProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    search(searchInfoRef.current.text, page, searchInfoRef.current.source).then((list) => {
      if (isUnmountedRef.current) return
      listRef.current?.setList(list, false, searchInfoRef.current.source == 'all')
      setSongCount(list.length)
      listRef.current?.setStatus(searchMusicState.listInfos[searchInfoRef.current.source]!.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      listRef.current?.setStatus('error')
    })
  }

  const handleLoadMore: OnlineListProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const info = searchMusicState.listInfos[searchInfoRef.current.source]!
    const page = info?.list.length ? info.page + 1 : 1
    search(searchInfoRef.current.text, page, searchInfoRef.current.source).then((list) => {
      if (isUnmountedRef.current) return
      listRef.current?.setList(list, true, searchInfoRef.current.source == 'all')
      setSongCount(info.list.length)
      listRef.current?.setStatus(info.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      listRef.current?.setStatus('error')
    })
  }

  return <OnlineList
    ref={listRef}
    onPlayList={handlePlayList}
    onRefresh={handleRefresh}
    onLoadMore={handleLoadMore}
    ListHeaderComponent={<PlayAllHeader onPlayAll={handlePlayAll} count={songCount} />}
    checkHomePagerIdle={false}
  />
})
