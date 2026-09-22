import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Easing, Image } from 'react-native'

export interface LaserCdStageProps {
  isPlaying: boolean
  picUrl?: string
}

export const LaserCdStage: React.FC<LaserCdStageProps> = ({ isPlaying, picUrl }) => {
  const spinAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null
    if (isPlaying) {
      animation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
      animation.start()
    } else {
      spinAnim.stopAnimation()
    }
    return () => {
      animation?.stop()
    }
  }, [isPlaying])

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View style={styles.container}>
      {/* Laser Holographic Optical Disc */}
      <Animated.View style={[styles.disc, { transform: [{ rotate: spin }] }]}>
        {/* Holographic Refraction Rings */}
        <View style={styles.hologramRing1} />
        <View style={styles.hologramRing2} />
        <View style={styles.hologramSheen} />

        {/* Center Artwork Spindle */}
        <View style={styles.centerHoleOuter}>
          {picUrl ? (
            <Image source={{ uri: picUrl }} style={styles.centerPic} />
          ) : (
            <View style={styles.centerFallback} />
          )}
          <View style={styles.centerHoleInner} />
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disc: {
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
    overflow: 'hidden',
  },
  hologramRing1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 14,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  hologramRing2: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 10,
    borderColor: 'rgba(236, 72, 153, 0.16)',
  },
  hologramSheen: {
    position: 'absolute',
    width: 290,
    height: 290,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  centerHoleOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#94a3b8',
    overflow: 'hidden',
  },
  centerPic: {
    width: 150,
    height: 150,
  },
  centerFallback: {
    width: 150,
    height: 150,
    backgroundColor: '#0ea5e9',
  },
  centerHoleInner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#090b0e',
    borderWidth: 2.5,
    borderColor: '#e2e8f0',
  },
})

export default LaserCdStage
