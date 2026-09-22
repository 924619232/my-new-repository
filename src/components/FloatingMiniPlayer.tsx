import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useTheme } from '@/store/theme/hook'

export interface FloatingMiniPlayerProps {
  title?: string
  artist?: string
  picUrl?: string
  isPlaying: boolean
  onTogglePlay: () => void
  onNext: () => void
  onPrev: () => void
  onOpenDetail: () => void
}

export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({
  title,
  artist,
  picUrl,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  onOpenDetail,
}) => {
  const theme = useTheme()

  return (
    <View style={styles.floatingWrapper}>
      <TouchableOpacity activeOpacity={0.9} style={styles.capsule} onPress={onOpenDetail}>
        {/* Cover Thumbnail */}
        <View style={styles.coverWrapper}>
          {picUrl ? (
            <Image source={{ uri: picUrl }} style={styles.coverImg} />
          ) : (
            <View style={styles.fallbackCover} />
          )}
        </View>

        {/* Info */}
        <View style={styles.infoWrapper}>
          <Text numberOfLines={1} style={styles.titleText}>{title || '臻品无损音频'}</Text>
          <Text numberOfLines={1} style={styles.artistText}>{artist || '高保真直连'}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={onTogglePlay} style={styles.controlBtn}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext} style={styles.controlBtn}>
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
