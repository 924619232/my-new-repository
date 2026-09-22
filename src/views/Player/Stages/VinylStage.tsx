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
    width: 330,
    height: 330,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  discShadow: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0,0,0,0.65)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 14,
  },
  disc: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#0f1115',
    borderWidth: 2,
    borderColor: '#1e2128',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grooveRing1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  grooveRing2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  grooveRing3: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  centerArtWrapper: {
    width: 190,
    height: 190,
    borderRadius: 95,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#181b22',
  },
  centerArt: {
    width: 190,
    height: 190,
  },
  centerArtFallback: {
    width: 190,
    height: 190,
    backgroundColor: '#10b981',
  },
  spindleHole: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#090b0e',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  tonearmWrapper: {
    position: 'absolute',
    top: 2,
    right: 15,
    width: 44,
    height: 145,
    transformOrigin: 'top center' as any,
  },
  tonearmPivot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: '#9ca3af',
  },
  tonearmShaft: {
    width: 4,
    height: 102,
    backgroundColor: '#9ca3af',
    marginLeft: 10,
  },
  tonearmCartridge: {
    width: 12,
    height: 20,
    backgroundColor: '#f59e0b',
    marginLeft: 6,
    borderRadius: 2,
  },
})

export default VinylStage
