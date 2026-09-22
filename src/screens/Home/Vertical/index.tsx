import { View, StyleSheet } from 'react-native'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import BottomTabBar from './BottomTabBar'
import PlayQueueModal from '@/components/player/PlayQueueModal'

export default () => {
  return (
    <View style={styles.container}>
      <Content />
      <PlayerBar isHome />
      <BottomTabBar />
      <PlayQueueModal />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
