import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'

// import { useGetter, useDispatch } from '@/store'
// import Tag from './Tag'
// import OpenList from './OpenList'
import { createStyle } from '@/utils/tools'
// import { BorderWidths } from '@/theme'
import SourceSelector, {
  type SourceSelectorType,
} from './SourceSelector'
import { useTheme } from '@/store/theme/hook'
// import { BorderWidths } from '@/theme'
import ActiveListName, { type ActiveListNameType } from './ActiveListName'
import { BorderWidths } from '@/theme'

export interface HeaderBarProps {
  onShowBound: () => void
  onSourceChange: (source: LX.OnlineSource) => void
  onPlayAll: () => void
}

export interface HeaderBarType {
  setBound: (source: LX.OnlineSource, id: string, name: string) => void
}


export default forwardRef<HeaderBarType, HeaderBarProps>(({ onShowBound, onSourceChange, onPlayAll }, ref) => {
  const activeListNameRef = useRef<ActiveListNameType>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    setBound(source, id, name) {
      sourceSelectorRef.current?.setSource(source)
      activeListNameRef.current?.setBound(id, name)
    },
  }), [])


  return (
    <View style={{ ...styles.currentList, borderBottomColor: theme['c-border-background'] }}>
      <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} />
      <ActiveListName ref={activeListNameRef} onShowBound={onShowBound} />
      <TouchableOpacity
        style={[
          styles.playAllBtn,
          {
            backgroundColor: theme.isDark ? 'rgba(7, 197, 86, 0.15)' : 'rgba(7, 197, 86, 0.1)',
            borderColor: theme['c-primary'],
          },
        ]}
        onPress={onPlayAll}
        activeOpacity={0.7}
      >
        <Icon name="play" size={11} color={theme['c-primary']} />
        <Text style={[styles.playAllText, { color: theme['c-primary'] }]}>
          播放全部
        </Text>
      </TouchableOpacity>
    </View>
  )
})

const styles = createStyle({
  currentList: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    zIndex: 2,
    borderBottomWidth: BorderWidths.normal,
  },
  selector: {
    width: 86,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  playAllText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 3,
  },
})
