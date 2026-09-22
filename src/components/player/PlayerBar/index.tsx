import { memo, useMemo } from 'react'
import { View, StyleSheet, TouchableOpacity, PanResponder } from 'react-native'
import { useKeyboard } from '@/utils/hooks'
import Pic from './components/Pic'
import Title from './components/Title'
import ControlBtn from './components/ControlBtn'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useProgress } from '@/store/player/hook'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { playNext, playPrev } from '@/core/player/player'

const HairlineProgress = () => {
  const { progress } = useProgress()
  const theme = useTheme()
  const pct = Math.min(Math.max((progress || 0) * 100, 0), 100)

  return (
    <View style={[styles.hairlineTrack, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' }]}>
      <View style={[styles.hairlineFill, { width: `${pct}%`, backgroundColor: theme['c-primary'] }]} />
    </View>
  )
}

export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const theme = useTheme()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')

  const handleOpenDetail = () => {
    if (commonState.componentIds.home) {
      navigations.pushPlayDetailScreen(commonState.componentIds.home)
    }
  }

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 18 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 35) {
        // Swiped right -> Previous track
        void playPrev()
      } else if (gestureState.dx < -35) {
        // Swiped left -> Next track
        void playNext()
      }
    },
  }), [])

  const playerComponent = useMemo(() => (
    <View style={styles.floatingContainer}>
      <View style={[
        styles.capsule,
        {
          backgroundColor: theme.isDark ? 'rgba(18, 24, 34, 0.96)' : 'rgba(255, 255, 255, 0.98)',
          borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
      ]}>
        {/* Top Hairline Progress Bar with Dynamic Accent */}
        <HairlineProgress />

        {/* Left & Center Gesture & Tap Area (Cover + Title + Live Lyrics) */}
        <View style={styles.interactiveArea} {...panResponder.panHandlers}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.touchableArea}
            onPress={handleOpenDetail}
          >
            <Pic isHome={isHome} />
            <View style={styles.center}>
              <Title isHome={isHome} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Right Isolated Button Controls: [Prev] [Play 38dp] [Next] [Queue] */}
        <View style={styles.right}>
          <ControlBtn />
        </View>
      </View>
    </View>
  ), [theme, isHome, panResponder])

  return autoHidePlayBar && keyboardShown ? null : playerComponent
})

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'relative',
    width: '100%',
    paddingHorizontal: 10,
    paddingBottom: 4,
    paddingTop: 2,
    backgroundColor: 'transparent',
  },
  capsule: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  hairlineTrack: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    zIndex: 10,
  },
  hairlineFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 1.5,
  },
  interactiveArea: {
    flex: 1,
    height: '100%',
  },
  touchableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  center: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
})
