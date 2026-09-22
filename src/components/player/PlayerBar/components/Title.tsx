import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo } from '@/store/player/hook'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'

export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()

  const handlePress = () => {
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)
  }

  const handleLongPress = () => {
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }

  const title = musicInfo.id ? musicInfo.name : 'CJY 臻品音频'
  const singer = musicInfo.id ? (musicInfo.singer || '无损原唱') : '极速直链秒播'

  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={handleLongPress}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text numberOfLines={1} style={styles.titleText}>
        {title}
      </Text>
      <Text numberOfLines={1} style={styles.singerText}>
        {singer}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
  },
  titleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  singerText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
})
