import { memo, useMemo } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useKeyboard } from '@/utils/hooks'
import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useProgress } from '@/store/player/hook'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'

const HairlineProgress = () => {
  const { progress } = useProgress()
  const pct = Math.min(Math.max((progress || 0) * 100, 0), 100)

  return (
    <View style={styles.hairlineTrack}>
      <View style={[styles.hairlineFill, { width: `${pct}%` }]} />
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

  const playerComponent = useMemo(() => (
    <View style={styles.floatingContainer}>
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.capsule}
        onPress={handleOpenDetail}
      >
        <Pic isHome={isHome} />
        <View style={styles.center}>
          <Title isHome={isHome} />
        </View>
        <View style={styles.right}>
          <ControlBtn />
        </View>
        <HairlineProgress />
      </TouchableOpacity>
    </View>
  ), [theme, isHome])

  return autoHidePlayBar && keyboardShown ? null : playerComponent
})

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'relative',
    width: '100%',
    paddingHorizontal: 12,
    paddingBottom: 6,
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  capsule: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(18, 22, 32, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  hairlineTrack: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  hairlineFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 1,
  },
  center: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
})
