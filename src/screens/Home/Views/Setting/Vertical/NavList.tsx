import { memo, useCallback, useState } from 'react'
import { View, TouchableOpacity, ScrollView } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { SETTING_SCREENS, type SettingScreenIds } from '../Main'
import { useI18n } from '@/lang'
import { BorderRadius, BorderWidths } from '@/theme'

const CATEGORY_ICONS: Record<SettingScreenIds, string> = {
  theme: '🎨',
  player: '🎧',
  library: '📁',
  common: '⚙️',
}

const ListItem = memo(({ id, activeId, onPress }: {
  onPress: (item: SettingScreenIds) => void
  activeId: string
  id: SettingScreenIds
}) => {
  const theme = useTheme()
  const t = useI18n()

  const active = activeId == id

  const handlePress = () => {
    onPress(id)
  }

  const icon = CATEGORY_ICONS[id] || ''

  return (
    <TouchableOpacity
      style={{
        ...styles.listItem,
        backgroundColor: active ? theme['c-primary-background-active'] : 'transparent',
        borderColor: active ? theme['c-primary'] : 'transparent',
      }}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text
        numberOfLines={1}
        size={14}
        color={active ? theme['c-primary-font'] : theme['c-font']}
        style={active ? styles.activeText : undefined}
      >
        {`${icon} ${t(`setting_${id}`)}`}
      </Text>
    </TouchableOpacity>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.id === nextProps.id &&
    prevProps.activeId != nextProps.id &&
    nextProps.activeId != nextProps.id
  )
})

export default ({ onChangeId }: {
  onChangeId: (id: SettingScreenIds) => void
}) => {
  const [activeId, setActiveId] = useState(global.lx.settingActiveId)
  const theme = useTheme()

  const handleChangeId = useCallback((id: SettingScreenIds) => {
    onChangeId(id)
    setActiveId(id)
    global.lx.settingActiveId = id
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={{ ...styles.container, borderBottomColor: theme['c-border-background'] }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps={'always'}
      >
        {
          SETTING_SCREENS.map(id => <ListItem key={id} id={id} activeId={activeId} onPress={handleChangeId} />)
        }
      </ScrollView>
    </View>
  )
}

const styles = createStyle({
  container: {
    height: 48,
    borderBottomWidth: BorderWidths.normal,
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 8,
  },
  listItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.normal,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeText: {
    fontWeight: 'bold',
  },
})

