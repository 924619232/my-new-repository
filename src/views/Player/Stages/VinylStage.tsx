import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Easing, Image } from 'react-native'

export interface VinylStageProps {
  isPlaying: boolean
  picUrl?: string
}

export const VinylStage: React.FC<VinylStageProps> = ({ isPlaying, picUrl }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current
  const armAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null
    if (isPlaying) {
      animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 18000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
      animation.start()
      Animated.timing(armAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start()
    } else {
      rotateAnim.stopAnimation()
      Animated.timing(armAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start()
    }
    return () => {
      animation?.stop()
    }
  }, [isPlaying])

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const armRotate = armAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30deg', '0deg'],
  })

  return (
    <View style={styles.container}>
      {/* Vinyl Disc Body */}
      <View style={styles.discShadow}>
        <Animated.View style={[styles.disc, { transform: [{ rotate: spin }] }]}>
          {/* Groove Rings */}
          <View style={styles.grooveRing1} />
          <View style={styles.grooveRing2} />
          <View style={styles.grooveRing3} />
          {/* Center Album Artwork */}
          <View style={styles.centerArtWrapper}>
            {picUrl ? (
              <Image source={{ uri: picUrl }} style={styles.centerArt} />
            ) : (
              <View style={styles.centerArtFallback} />
            )}
            <View style={styles.spindleHole} />
          </View>
        </Animated.View>
      </View>

      {/* Turntable Tonearm */}
      <Animated.View style={[styles.tonearmWrapper, { transform: [{ rotate: armRotate }] }]}>
        <View style={styles.tonearmPivot} />
        <View style={styles.tonearmShaft} />
        <View style={styles.tonearmCartridge} />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  discShadow: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0,0,0,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  disc: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#111215',
    borderWidth: 2,
    borderColor: '#22242a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grooveRing1: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  grooveRing2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  grooveRing3: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  centerArtWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1e2128',
  },
  centerArt: {
    width: 110,
    height: 110,
  },
  centerArtFallback: {
    width: 110,
    height: 110,
    backgroundColor: '#10b981',
  },
  spindleHole: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#090b0e',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  tonearmWrapper: {
    position: 'absolute',
    top: 5,
    right: 20,
    width: 40,
    height: 130,
    transformOrigin: 'top center' as any,
  },
  tonearmPivot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: '#9ca3af',
  },
  tonearmShaft: {
    width: 4,
    height: 90,
    backgroundColor: '#9ca3af',
    marginLeft: 9,
  },
  tonearmCartridge: {
    width: 10,
    height: 18,
    backgroundColor: '#f59e0b',
    marginLeft: 6,
    borderRadius: 2,
  },
})

export default VinylStage
