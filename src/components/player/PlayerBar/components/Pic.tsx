import { StyleSheet, View, Animated, Easing } from 'react-native'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import Image from '@/components/common/Image'
import { useCallback, useEffect, useRef } from 'react'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'
import { Icon } from '@/components/common/Icon'

export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlaying = useIsPlay()
  const spinAnim = useRef(new Animated.Value(0)).current
  const spinAnimationRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    if (isPlaying) {
      spinAnimationRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      )
      spinAnimationRef.current.start()
    } else {
      spinAnimationRef.current?.stop()
    }
  }, [isPlaying])

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({
      pic: null,
    })
  }, [])

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        {musicInfo.pic ? (
          <Image
            url={musicInfo.pic}
            nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
            style={styles.image}
            onError={handleError}
          />
        ) : (
          <View style={styles.fallbackDisk}>
            <Icon name="album" size={22} color="#10b981" />
          </View>
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#10b981',
    backgroundColor: '#1f293d',
  },
  fallbackDisk: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#10b981',
    backgroundColor: '#121620',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
