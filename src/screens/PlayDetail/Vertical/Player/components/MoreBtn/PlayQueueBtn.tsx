import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'

export default () => {
  const theme = useTheme()
  const handleShowQueue = () => {
    global.app_event.emit('showPlayQueueModal')
  }

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      style={{
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onPress={handleShowQueue}
    >
      <Icon name="menu" color={theme['c-button-font'] || '#ffffff'} size={20} />
    </TouchableOpacity>
  )
}
