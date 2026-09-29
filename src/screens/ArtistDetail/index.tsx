import { useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import { pop } from '@/navigation'
import PlayerBar from '@/components/player/PlayerBar'
import PlayQueueModal from '@/components/player/PlayQueueModal'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import { search } from '@/core/search/music'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { BorderWidths } from '@/theme'
import { createStyle, toast } from '@/utils/tools'
import { handlePlay } from '@/screens/Home/Views/Search/listAction'

export interface ArtistDetailProps {
  componentId: string
  artist: string
}

export default ({ componentId, artist }: ArtistDetailProps) => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  const listRef = useRef<OnlineListType>(null)
  const [songList, setSongList] = useState<LX.Music.MusicInfoOnline[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'refreshing' | 'error' | 'end'>('loading')
  const pageRef = useRef(1)
  const isUnmountedRef = useRef(false)

  const loadSongs = (page: number, append: boolean = false) => {
    if (!append) {
      listRef.current?.setStatus('loading')
      setStatus('loading')
    }
    return search(artist, page, 'kw').then((list) => {
      if (isUnmountedRef.current) return
      const nextList = append ? [...songList, ...list] : list
      setSongList(nextList)
      listRef.current?.setList(nextList, append, false)
      const nextStatus = list.length < 30 ? 'end' : 'idle'
      setStatus(nextStatus)
      listRef.current?.setStatus(nextStatus)
    }).catch(() => {
      if (isUnmountedRef.current) return
      listRef.current?.setStatus('error')
      setStatus('error')
    })
  }

  useEffect(() => {
    isUnmountedRef.current = false
    pageRef.current = 1
    void loadSongs(1, false)
    return () => {
      isUnmountedRef.current = true
    }
  }, [artist])

  const handleBack = () => {
    void pop(componentId)
  }

  const handlePlayAll = () => {
    if (!songList.length) {
      toast('暂无可播放曲目')
      return
    }
    toast(`已开始播放【${artist}】全部单曲`)
    void handlePlay(songList, 0)
  }

  const handlePlayList: OnlineListProps['onPlayList'] = (index) => {
    if (!songList.length) return
    void handlePlay(songList, index)
  }

  const handleRefresh = () => {
    pageRef.current = 1
    void loadSongs(1, false)
  }

  const handleLoadMore = () => {
    if (status !== 'idle') return
    pageRef.current += 1
    void loadSongs(pageRef.current, true)
  }

  return (
    <PageContent>
      <StatusBar />
      <View style={{ ...styles.header, paddingTop: statusBarHeight + 6, borderBottomColor: theme['c-border-background'] }}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Icon name="chevron-left" size={24} color={theme['c-font']} />
          </TouchableOpacity>
          <View style={styles.titleContent}>
            <Text size={17} numberOfLines={1} style={{ fontWeight: 'bold' }}>{artist}</Text>
            <Text size={11} color={theme['c-font-label']}>
              歌手专页 · {songList.length > 0 ? `已收录 ${songList.length} 首代表作` : '正在检索曲库...'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.playAllBtn,
              {
                backgroundColor: theme.isDark ? 'rgba(7, 197, 86, 0.15)' : 'rgba(7, 197, 86, 0.1)',
                borderColor: theme['c-primary'],
              },
            ]}
            onPress={handlePlayAll}
            activeOpacity={0.7}
          >
            <Icon name="play" size={11} color={theme['c-primary']} />
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme['c-primary'], marginLeft: 4 }}>
              播放全部
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <OnlineList
        ref={listRef}
        onPlayList={handlePlayList}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        checkHomePagerIdle={false}
      />
      <PlayerBar />
      <PlayQueueModal />
    </PageContent>
  )
}

const styles = createStyle({
  header: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: BorderWidths.normal,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContent: {
    flex: 1,
    paddingHorizontal: 8,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
})
