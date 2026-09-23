import { View, StyleSheet } from 'react-native'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import BottomTabBar from './BottomTabBar'
import PlayQueueModal from '@/components/player/PlayQueueModal'
import { useTheme } from '@/store/theme/hook'

export default () => {
  const theme = useTheme()
  return (
    <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
      <Content />
      <BottomTabBar />
      <View pointerEvents="box-none" style={styles.floatingPlayerWrapper}>
        <PlayerBar isHome />
      </View>
      <PlayQueueModal />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  floatingPlayerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 44,
    zIndex: 100,
  },
})
