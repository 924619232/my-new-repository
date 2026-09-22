import React, { useEffect, useState } from 'react'
import { View, StyleSheet, BackHandler } from 'react-native'
import MusicList from './MusicList'
import MyList from './MyList'
import { useNavActiveId } from '@/store/common/hook'

export default () => {
  const [viewMode, setViewMode] = useState<'songs' | 'lists'>('songs')
  const activeNavId = useNavActiveId()

  useEffect(() => {
    const handleToggleList = (visible: boolean) => {
      setViewMode(visible ? 'lists' : 'songs')
    }

    global.app_event.on('changeLoveListVisible', handleToggleList)
    return () => {
      global.app_event.off('changeLoveListVisible', handleToggleList)
    }
  }, [])

  // Android back button handling in lists view
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeNavId === 'nav_love' && viewMode === 'lists') {
        setViewMode('songs')
        return true
      }
      return false
    })
    return () => backHandler.remove()
  }, [activeNavId, viewMode])

  return (
    <View style={styles.container}>
      {viewMode === 'lists' ? (
        <MyList onBackToSongs={() => setViewMode('songs')} />
      ) : (
        <MusicList />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090a0f',
  },
})
