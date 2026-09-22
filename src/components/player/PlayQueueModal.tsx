import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect, useMemo, useCallback } from 'react'
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native'
import Popup, { type PopupType, type PopupProps } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { usePlayMusicInfo } from '@/store/player/hook'
import { getListMusics, removeListMusics } from '@/core/list'
import { playList } from '@/core/player/player'
import listState from '@/store/list/state'
import { LIST_IDS } from '@/config/constant'

export interface PlayQueueModalProps extends Omit<PopupProps, 'children'> {}

export interface PlayQueueModalType {
  show: () => void
}

const { height: WIN_HEIGHT } = Dimensions.get('window')

export default forwardRef<PlayQueueModalType, PlayQueueModalProps>((props, ref) => {
  const [visible, setVisible] = useState(false)
  const [queueSongs, setQueueSongs] = useState<LX.Music.MusicInfo[]>([])
  const popupRef = useRef<PopupType>(null)
  const theme = useTheme()
  const playMusicInfo = usePlayMusicInfo()

  const currentListId = playMusicInfo.listId || LIST_IDS.DEFAULT
  const currentMusicId = playMusicInfo.musicInfo?.id

  const loadQueue = useCallback(async () => {
    if (!currentListId) return
    try {
      const musics = await getListMusics(currentListId)
      setQueueSongs(musics || [])
    } catch (e) {
      setQueueSongs([])
    }
  }, [currentListId])

  const showModal = () => {
    void loadQueue()
    if (visible) popupRef.current?.setVisible(true)
    else {
      setVisible(true)
      requestAnimationFrame(() => {
        popupRef.current?.setVisible(true)
      })
    }
  }

  useImperativeHandle(ref, () => ({
    show: showModal,
  }))

  useEffect(() => {
    const handleShow = () => showModal()
    global.app_event.on('showPlayQueueModal', handleShow)
    return () => {
      global.app_event.off('showPlayQueueModal', handleShow)
    }
  }, [visible, loadQueue])

  const listTitle = useMemo(() => {
    switch (currentListId) {
      case LIST_IDS.DEFAULT:
        return global.i18n.t('list_name_default') || '默认列表'
      case LIST_IDS.LOVE:
        return global.i18n.t('list_name_love') || '我的收藏'
      case LIST_IDS.TEMP:
        return global.i18n.t('list_name_temp') || '临时列表'
      default:
        return listState.allList.find(l => l.id === currentListId)?.name || '当前播放'
    }
  }, [currentListId])

  const handlePlaySong = (index: number) => {
    if (!currentListId) return
    void playList(currentListId, index)
  }

  const handleRemoveSong = async (song: LX.Music.MusicInfo) => {
    if (!currentListId) return
    await removeListMusics(currentListId, [song.id])
    void loadQueue()
  }

  if (!visible) return null

  return (
    <Popup ref={popupRef} position="bottom" closeBtn={true}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme['c-main-background'] || '#121620',
            borderTopColor: theme['c-border-background'] || 'rgba(255, 255, 255, 0.08)',
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme['c-font'] || '#ffffff' }]}>播放队列</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{listTitle}</Text>
            </View>
            <Text style={styles.countText}>({queueSongs.length}首)</Text>
          </View>
        </View>

        {/* Songs List */}
        <FlatList
          data={queueSongs}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const isPlaying = item.id === currentMusicId
            return (
              <TouchableOpacity
                style={[
                  styles.songItem,
                  isPlaying && styles.songItemActive,
                  { borderBottomColor: 'rgba(255, 255, 255, 0.04)' },
                ]}
                activeOpacity={0.7}
                onPress={() => handlePlaySong(index)}
              >
                <View style={styles.indexCol}>
                  {isPlaying ? (
                    <Icon name="play" size={14} color="#10b981" />
                  ) : (
                    <Text style={styles.indexText}>{index + 1}</Text>
                  )}
                </View>

                <View style={styles.infoCol}>
                  <Text
                    style={[
                      styles.songName,
                      { color: isPlaying ? '#34d399' : theme['c-font'] || '#ffffff' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.singerName} numberOfLines={1}>
                    {item.singer}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.removeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => handleRemoveSong(item)}
                >
                  <Icon name="close" size={14} color="#6b7280" />
                </TouchableOpacity>
              </TouchableOpacity>
            )
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>当前队列暂无曲目</Text>
            </View>
          }
        />
      </View>
    </Popup>
  )
})

const styles = StyleSheet.create({
  container: {
    height: Math.min(WIN_HEIGHT * 0.6, 480),
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeText: {
    fontSize: 11,
    color: '#34d399',
    fontWeight: '600',
  },
  countText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  songItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  indexCol: {
    width: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoCol: {
    flex: 1,
    paddingRight: 12,
  },
  songName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  singerName: {
    fontSize: 11,
    color: '#9ca3af',
  },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
})
