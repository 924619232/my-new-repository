import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import { search } from '@/core/search/music'
import searchMusicState, { type Source } from '@/store/search/music/state'
import { handlePlay } from './listAction'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { BorderWidths } from '@/theme'
import { toast } from '@/utils/tools'
import { searchArtist } from '@/core/search/search'
import { getArtistAvatarUrl } from '@/utils/artistAvatar'

export interface MusicListType {
  loadList: (text: string, source: Source) => void
}

interface DetectedArtistInfo {
  name: string
  avatarUrl?: string
}

const SearchHeader = ({
  onPlayAll,
  count,
  artistInfo,
  onEnterArtist,
}: {
  onPlayAll: () => void
  count: number
  artistInfo: DetectedArtistInfo | null
  onEnterArtist: () => void
}) => {
  const theme = useTheme()
  if (count <= 0 && !artistInfo) return null

  const artist = artistInfo?.name
  const avatarUrl = artistInfo?.avatarUrl

  return (
    <View>
      {artist ? (
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginHorizontal: 12,
            marginTop: 8,
            marginBottom: 4,
            borderRadius: 12,
            backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
            borderWidth: BorderWidths.normal,
            borderColor: theme['c-border-background'],
          }}
          onPress={onEnterArtist}
          activeOpacity={0.7}
        >
          {avatarUrl ? (
            <Image
              url={avatarUrl}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                marginRight: 12,
              }}
            />
          ) : (
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme['c-primary'],
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>
                {artist.charAt(0)}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text size={16} numberOfLines={1} style={{ fontWeight: 'bold', color: theme['c-font'] }}>
                {artist}
              </Text>
              <View style={{
                marginLeft: 8,
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 4,
                backgroundColor: theme.isDark ? 'rgba(7, 197, 86, 0.2)' : 'rgba(7, 197, 86, 0.12)',
              }}>
                <Text size={10} color={theme['c-primary']} style={{ fontWeight: 'bold' }}>歌手</Text>
              </View>
            </View>
            <Text size={11} color={theme['c-font-label']} style={{ marginTop: 2 }}>
              点击进入专属歌手主页 · 查看代表作与全部单曲
            </Text>
          </View>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 14,
            backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
          }}>
            <Text size={12} color={theme['c-primary']} style={{ fontWeight: 'bold', marginRight: 2 }}>进入</Text>
            <Icon name="chevron-right" size={13} color={theme['c-primary']} />
          </View>
        </TouchableOpacity>
      ) : null}

      {count > 0 ? (
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
      ) : null}
    </View>
  )
}

export default forwardRef<MusicListType, {}>((props, ref) => {
  const listRef = useRef<OnlineListType>(null)
  const searchInfoRef = useRef<{ text: string, source: Source }>({ text: '', source: 'kw' })
  const isUnmountedRef = useRef(false)
  const [songCount, setSongCount] = useState(0)
  const [currentQuery, setCurrentQuery] = useState('')
  const [currentSongs, setCurrentSongs] = useState<LX.Music.MusicInfoOnline[]>([])

  useImperativeHandle(ref, () => ({
    async loadList(text, source) {
      listRef.current?.setList([], false, source == 'all')
      setSongCount(0)
      setCurrentQuery(text)
      searchInfoRef.current.text = text
      searchInfoRef.current.source = source
      if (searchMusicState.searchText == text && searchMusicState.source == source && searchMusicState.listInfos[searchMusicState.source]!.list.length) {
        requestAnimationFrame(() => {
          const list = searchMusicState.listInfos[searchMusicState.source]!.list
          listRef.current?.setList(list, false, source == 'all')
          setSongCount(list.length)
          setCurrentSongs(list)
        })
      } else {
        listRef.current?.setStatus('loading')
        const page = 1
        return search(text, page, source).then((list) => {
          if (isUnmountedRef.current) return
          requestAnimationFrame(() => {
            listRef.current?.setList(list, false, source == 'all')
            setSongCount(list.length)
            setCurrentSongs(list)
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

  const detectedArtist = useMemo<DetectedArtistInfo | null>(() => {
    const query = (currentQuery || searchInfoRef.current.text || '').trim()
    if (!query) return null
    const list = currentSongs.length ? currentSongs : (searchMusicState.listInfos[searchMusicState.source]?.list ?? [])
    if (!list.length) return null

    for (const song of list.slice(0, 10)) {
      const s = song.singer?.trim()
      if (!s) continue
      const singers = s.split(/[/&,，、]/).map(it => it.trim()).filter(Boolean)
      for (const singer of singers) {
        if (
          singer.toLowerCase() === query.toLowerCase() ||
          query.toLowerCase().includes(singer.toLowerCase()) ||
          singer.toLowerCase().includes(query.toLowerCase())
        ) {
          const avatarUrl = song.meta?.picUrl || (song as any).img || undefined
          return { name: singer, avatarUrl }
        }
      }
    }
    return null
  }, [currentQuery, currentSongs, songCount])

  const [onlineAvatar, setOnlineAvatar] = useState<string | null>(null)

  useEffect(() => {
    if (!detectedArtist?.name) {
      setOnlineAvatar(null)
      return
    }
    if (detectedArtist.avatarUrl) {
      setOnlineAvatar(detectedArtist.avatarUrl)
      return
    }
    let cancel = false
    void getArtistAvatarUrl(detectedArtist.name).then((url) => {
      if (!cancel && url) setOnlineAvatar(url)
    })
    return () => {
      cancel = true
    }
  }, [detectedArtist?.name, detectedArtist?.avatarUrl])

  const effectiveArtistInfo = useMemo<DetectedArtistInfo | null>(() => {
    if (!detectedArtist) return null
    return {
      name: detectedArtist.name,
      avatarUrl: onlineAvatar || detectedArtist.avatarUrl,
    }
  }, [detectedArtist, onlineAvatar])

  const handleEnterArtist = () => {
    if (effectiveArtistInfo) {
      searchArtist(effectiveArtistInfo.name, effectiveArtistInfo.avatarUrl)
    }
  }

  return <OnlineList
    ref={listRef}
    onPlayList={handlePlayList}
    onRefresh={handleRefresh}
    onLoadMore={handleLoadMore}
    ListHeaderComponent={
      <SearchHeader
        onPlayAll={handlePlayAll}
        count={songCount}
        artistInfo={effectiveArtistInfo}
        onEnterArtist={handleEnterArtist}
      />
    }
    checkHomePagerIdle={false}
  />
})
