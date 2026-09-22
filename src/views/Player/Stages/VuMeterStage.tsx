import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'

export interface VuMeterStageProps {
  isPlaying: boolean
}

export const VuMeterStage: React.FC<VuMeterStageProps> = ({ isPlaying }) => {
  const needleLeftAnim = useRef(new Animated.Value(0)).current
  const needleRightAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let timer: any = null
    if (isPlaying) {
      const step = () => {
        const targetLeft = Math.random() * 0.7 + 0.2
        const targetRight = Math.random() * 0.7 + 0.2
        Animated.parallel([
          Animated.timing(needleLeftAnim, {
            toValue: targetLeft,
            duration: 180 + Math.random() * 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(needleRightAnim, {
            toValue: targetRight,
            duration: 180 + Math.random() * 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isPlaying) {
            timer = setTimeout(step, 40)
          }
        })
      }
      step()
    } else {
      Animated.parallel([
        Animated.timing(needleLeftAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(needleRightAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start()
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isPlaying])

  const rotLeft = needleLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-35deg', '35deg'],
  })

  const rotRight = needleRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-35deg', '35deg'],
  })

  return (
    <View style={styles.vuMeterBox}>
      {/* Header Badge */}
      <View style={styles.headerRow}>
        <Text style={styles.meterBrand}>MCINTOSH LABORATORY PRECISION DUAL VU</Text>
      </View>

      {/* Dual Gauges */}
      <View style={styles.gaugesContainer}>
        {/* Left Channel */}
        <View style={styles.gauge}>
          <Text style={styles.channelLabel}>LEFT CHANNEL (dB)</Text>
          <View style={styles.scaleArc}>
            <Text style={styles.scaleTick}>-20</Text>
            <Text style={styles.scaleTick}>-10</Text>
            <Text style={styles.scaleTick}>-5</Text>
            <Text style={styles.scaleTick}>0</Text>
            <Text style={[styles.scaleTick, styles.redTick]}>+3</Text>
          </View>
          <View style={styles.needlePivot}>
            <Animated.View style={[styles.needle, { transform: [{ rotate: rotLeft }] }]} />
          </View>
        </View>

        {/* Right Channel */}
        <View style={styles.gauge}>
          <Text style={styles.channelLabel}>RIGHT CHANNEL (dB)</Text>
          <View style={styles.scaleArc}>
            <Text style={styles.scaleTick}>-20</Text>
            <Text style={styles.scaleTick}>-10</Text>
            <Text style={styles.scaleTick}>-5</Text>
            <Text style={styles.scaleTick}>0</Text>
            <Text style={[styles.scaleTick, styles.redTick]}>+3</Text>
          </View>
          <View style={styles.needlePivot}>
            <Animated.View style={[styles.needle, { transform: [{ rotate: rotRight }] }]} />
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  vuMeterBox: {
    width: 300,
    height: 190,
    backgroundColor: '#0a0d12',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e293b',
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 4,
  },
  meterBrand: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 1.5,
  },
  gaugesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  gauge: {
    flex: 1,
    height: 135,
    backgroundColor: '#172554',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    padding: 6,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  channelLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#93c5fd',
  },
  scaleArc: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 10,
  },
  scaleTick: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#e0f2fe',
  },
  redTick: {
    color: '#ef4444',
  },
  needlePivot: {
    position: 'absolute',
    bottom: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0f172a',
    borderWidth: 3,
    borderColor: '#38bdf8',
    alignItems: 'center',
  },
  needle: {
    position: 'absolute',
    bottom: 12,
    width: 2,
    height: 95,
    backgroundColor: '#f59e0b',
    borderRadius: 1,
    transformOrigin: 'bottom center' as any,
  },
})

export default VuMeterStage
