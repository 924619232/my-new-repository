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
    width: 270,
    height: 270,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disc: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  hologramRing1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 12,
    borderColor: 'rgba(56, 189, 248, 0.18)',
  },
  hologramRing2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: 'rgba(236, 72, 153, 0.15)',
  },
  hologramSheen: {
    position: 'absolute',
    width: 250,
    height: 250,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  centerHoleOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#94a3b8',
    overflow: 'hidden',
  },
  centerPic: {
    width: 80,
    height: 80,
  },
  centerFallback: {
    width: 80,
    height: 80,
    backgroundColor: '#0ea5e9',
  },
  centerHoleInner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#090b0e',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
})

export default LaserCdStage
