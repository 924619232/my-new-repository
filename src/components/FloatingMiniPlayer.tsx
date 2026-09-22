import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { togglePlay, playNext } from '@/core/player/player'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'

export interface FloatingMiniPlayerProps {
  title?: string
  artist?: string
  picUrl?: string
  isPlaying?: boolean
  onTogglePlay?: () => void
  onNext?: () => void
  onPrev?: () => void
  onOpenDetail?: () => void
}

export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({
  title,
  artist,
  picUrl,
  isPlaying,
  onTogglePlay,
  onNext,
  onOpenDetail,
}) => {
  const theme = useTheme()
  const liveMusicInfo = usePlayerMusicInfo()
  const liveIsPlaying = useIsPlay()

  const currentTitle = title || liveMusicInfo.name || 'CJY 臻品音频'
  const currentArtist = artist || liveMusicInfo.singer || '国内秒播直解'
  const currentPic = picUrl || liveMusicInfo.pic
  const currentPlaying = isPlaying !== undefined ? isPlaying : liveIsPlaying

  const handleTogglePlay = onTogglePlay || (() => togglePlay())
  const handleNext = onNext || (() => playNext())
  const handleOpenDetail = onOpenDetail || (() => {
    if (commonState.componentIds.home) {
      navigations.pushPlayDetailScreen(commonState.componentIds.home, true)
    }
  })

  // 如果没有播放歌曲，隐蔽浮窗以保持主屏清爽
  if (!liveMusicInfo.id && !title) return null

  return (
    <View style={styles.floatingWrapper}>
      <TouchableOpacity activeOpacity={0.9} style={styles.capsule} onPress={handleOpenDetail}>
        {/* Cover Thumbnail */}
        <View style={styles.coverWrapper}>
          {currentPic ? (
            <Image source={{ uri: currentPic }} style={styles.coverImg} />
          ) : (
            <View style={styles.fallbackCover} />
          )}
        </View>

        {/* Info */}
        <View style={styles.infoWrapper}>
          <Text numberOfLines={1} style={styles.titleText}>{currentTitle}</Text>
          <Text numberOfLines={1} style={styles.artistText}>{currentArtist}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={handleTogglePlay} style={styles.controlBtn}>
            <Text style={styles.playIcon}>{currentPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.controlBtn}>
            <Text style={styles.nextIcon}>⏭</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  capsule: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(15, 20, 28, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  coverWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  coverImg: {
    width: 42,
    height: 42,
  },
  fallbackCover: {
    width: 42,
    height: 42,
    backgroundColor: '#10b981',
  },
  infoWrapper: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  artistText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 6,
  },
  controlBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 14,
    color: '#10b981',
  },
  nextIcon: {
    fontSize: 12,
    color: '#e5e7eb',
  },
})

export default FloatingMiniPlayer
