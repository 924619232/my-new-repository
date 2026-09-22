import { View, StyleSheet } from 'react-native'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { useLrcPlay } from '@/plugins/lyric'
import Text from '@/components/common/Text'

export default ({ isHome }: { isHome?: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const lrcInfo = useLrcPlay()
  const theme = useTheme()

  const title = musicInfo.id ? musicInfo.name : '洛雪音乐'
  const singer = musicInfo.id ? (musicInfo.singer || '官方原唱') : '听你想听'
  const album = (musicInfo as any)?.albumName || (musicInfo as any)?.meta?.albumName || ''

  const hasLiveLyric = Boolean(isPlay && lrcInfo?.text)
  const subtitle = hasLiveLyric ? `♪ ${lrcInfo.text}` : (album ? `${singer} · ${album}` : singer)

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.titleRow}>
        <Text numberOfLines={1} style={[styles.titleText, { color: theme['c-font'] || '#ffffff' }]}>
          {title}
        </Text>
        <View style={styles.hiResBadge}>
          <Text style={styles.hiResText}>Hi-Res</Text>
        </View>
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.subtitleText,
          { color: hasLiveLyric ? (theme['c-primary'] || '#34d399') : (theme['c-font-label'] || '#9ca3af') },
          hasLiveLyric ? styles.lyricActiveText : styles.singerMutedText,
        ]}
      >
        {subtitle}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  hiResBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(234, 179, 8, 0.16)',
    borderWidth: 0.5,
    borderColor: '#eab308',
  },
  hiResText: {
    color: '#facc15',
    fontSize: 9,
    fontWeight: 'bold',
  },
  subtitleText: {
    fontSize: 12,
    marginTop: 2,
  },
  lyricActiveText: {
    fontWeight: '600',
  },
  singerMutedText: {
    opacity: 0.7,
  },
})
