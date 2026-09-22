import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native'

export interface CassetteStageProps {
  isPlaying: boolean
  title?: string
  artist?: string
  picUrl?: string
}

export const CassetteStage: React.FC<CassetteStageProps> = ({ isPlaying, title, artist, picUrl }) => {
  const spinAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null
    if (isPlaying) {
      animation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 4000,
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
    <View style={styles.cassetteBody}>
      {/* Top Label */}
      <View style={styles.cassetteLabel}>
        <Text style={styles.cassetteBrand}>CHROME POSITION TYPE II · HI-FI 90</Text>
        <Text numberOfLines={1} style={styles.cassetteTitle}>{title || 'CLASSIC TAPE'}</Text>
        <Text numberOfLines={1} style={styles.cassetteArtist}>{artist || 'Master Recording'}</Text>
      </View>

      {/* Middle Window (Reels & Tape) */}
      <View style={styles.tapeWindow}>
        {/* Left Reel */}
        <Animated.View style={[styles.reel, { transform: [{ rotate: spin }] }]}>
          <View style={styles.reelTooth1} />
          <View style={styles.reelTooth2} />
          <View style={styles.reelTooth3} />
        </Animated.View>

        {/* Tape Bridge & Ruler */}
        <View style={styles.tapeRuler}>
          <View style={styles.tapeRulerTick} />
          <View style={styles.tapeRulerTick} />
          <View style={styles.tapeRulerTick} />
        </View>

        {/* Right Reel */}
        <Animated.View style={[styles.reel, { transform: [{ rotate: spin }] }]}>
          <View style={styles.reelTooth1} />
          <View style={styles.reelTooth2} />
          <View style={styles.reelTooth3} />
        </Animated.View>
      </View>

      {/* Bottom Screws & Guide */}
      <View style={styles.bottomGuide}>
        <View style={styles.guideScrew} />
        <View style={styles.guidePinchRoller} />
        <View style={styles.guideScrew} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  cassetteBody: {
    width: 270,
    height: 180,
    backgroundColor: '#1c1e24',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  cassetteLabel: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  cassetteBrand: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ef4444',
    letterSpacing: 1,
  },
  cassetteTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  cassetteArtist: {
    fontSize: 10,
    color: '#4b5563',
  },
  tapeWindow: {
    height: 64,
    backgroundColor: '#0b0d11',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262930',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  reel: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelTooth1: {
    position: 'absolute',
    width: 4,
    height: 30,
    backgroundColor: '#1f2937',
    borderRadius: 2,
  },
  reelTooth2: {
    position: 'absolute',
    width: 4,
    height: 30,
    backgroundColor: '#1f2937',
    borderRadius: 2,
    transform: [{ rotate: '60deg' }],
  },
  reelTooth3: {
    position: 'absolute',
    width: 4,
    height: 30,
    backgroundColor: '#1f2937',
    borderRadius: 2,
    transform: [{ rotate: '120deg' }],
  },
  tapeRuler: {
    flexDirection: 'row',
    gap: 6,
  },
  tapeRulerTick: {
    width: 2,
    height: 12,
    backgroundColor: '#4b5563',
  },
  bottomGuide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  guideScrew: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6b7280',
  },
  guidePinchRoller: {
    width: 40,
    height: 12,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
})

export default CassetteStage
