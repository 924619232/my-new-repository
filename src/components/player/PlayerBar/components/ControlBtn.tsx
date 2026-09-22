import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay } from '@/store/player/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { createStyle } from '@/utils/tools'
import { useHorizontalMode } from '@/utils/hooks'

const handlePlayPrev = () => {
  void playPrev()
}
const handlePlayNext = () => {
  void playNext()
}

const PlayPrevBtn = () => {
  return (
    <TouchableOpacity style={styles.iconBtn} activeOpacity={0.6} onPress={handlePlayPrev}>
      <Icon name='prevMusic' color='#9ca3af' size={18} />
    </TouchableOpacity>
  )
}

const PlayNextBtn = () => {
  return (
    <TouchableOpacity style={styles.iconBtn} activeOpacity={0.6} onPress={handlePlayNext}>
      <Icon name='nextMusic' color='#e5e7eb' size={20} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = () => {
  const isPlay = useIsPlay()

  return (
    <TouchableOpacity style={styles.playPillBtn} activeOpacity={0.8} onPress={togglePlay}>
      <Icon name={isPlay ? 'pause' : 'play'} color='#ffffff' size={16} />
    </TouchableOpacity>
  )
}

export default () => {
  const isHorizontalMode = useHorizontalMode()
  return (
    <View style={styles.controlsRow}>
      {isHorizontalMode ? <PlayPrevBtn /> : null}
      <TogglePlayBtn />
      <PlayNextBtn />
    </View>
  )
}

const styles = createStyle({
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPillBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
})
