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
          {/* Full-bleed Album Artwork covering Vinyl Disc */}
          <View style={styles.centerArtWrapper}>
            {picUrl ? (
              <Image source={{ uri: picUrl }} style={styles.centerArt} />
            ) : (
              <View style={styles.centerArtFallback} />
            )}
            {/* Vinyl Groove Rings & Reflection Overlays */}
            <View pointerEvents="none" style={styles.grooveRing1} />
            <View pointerEvents="none" style={styles.grooveRing2} />
            <View pointerEvents="none" style={styles.grooveRing3} />
            <View pointerEvents="none" style={styles.spindleHole} />
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
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  discShadow: {
    width: 284,
    height: 284,
    borderRadius: 142,
    backgroundColor: 'rgba(0,0,0,0.65)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 14,
  },
  disc: {
    width: 284,
    height: 284,
    borderRadius: 142,
    backgroundColor: '#0c0d11',
    borderWidth: 3,
    borderColor: '#181b22',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  centerArtWrapper: {
    width: 270,
    height: 270,
    borderRadius: 135,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerArt: {
    width: 270,
    height: 270,
  },
  centerArtFallback: {
    width: 270,
    height: 270,
    backgroundColor: '#10b981',
  },
  grooveRing1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  grooveRing2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
  },
  grooveRing3: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  spindleHole: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#090b0e',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  tonearmWrapper: {
    position: 'absolute',
    top: 6,
    right: 20,
    width: 44,
    height: 140,
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
    height: 98,
    backgroundColor: '#9ca3af',
    marginLeft: 9,
  },
  tonearmCartridge: {
    width: 12,
    height: 18,
    backgroundColor: '#f59e0b',
    marginLeft: 5,
    borderRadius: 2,
  },
})

export default VinylStage
