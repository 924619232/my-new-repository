import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import { LIST_IDS, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import Image from '@/components/common/Image'
import { useCallback } from 'react'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'
import { Icon } from '@/components/common/Icon'

export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlaying = useIsPlay()

  const handlePress = () => {
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)
  }

  const handleLongPress = () => {
    if (!isHome) return
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({
      pic: null,
    })
  }, [])

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      onPress={handlePress}
      activeOpacity={0.8}
      style={styles.wrapper}
    >
      {musicInfo.pic ? (
        <Image
          url={musicInfo.pic}
          nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
          style={styles.image}
          onError={handleError}
        />
      ) : (
        <View style={styles.fallbackDisk}>
          <Icon name="album" size={20} color="#10b981" />
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingLeft: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#10b981',
    backgroundColor: '#1f293d',
  },
  fallbackDisk: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#10b981',
    backgroundColor: '#121620',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
