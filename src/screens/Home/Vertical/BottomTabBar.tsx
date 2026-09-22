import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { setNavActiveId } from '@/core/common'

interface TabItem {
  id: 'nav_songlist' | 'nav_top' | 'nav_love' | 'nav_setting'
  icon: string
  label: string
}

const TABS: TabItem[] = [
  { id: 'nav_songlist', icon: 'home', label: '发现' },
  { id: 'nav_top', icon: 'leaderboard', label: '榜单' },
  { id: 'nav_love', icon: 'love', label: '我的' },
  { id: 'nav_setting', icon: 'setting', label: '设置' },
]

export const BottomTabBar: React.FC = () => {
  const activeId = useNavActiveId()
  const theme = useTheme()

  const handleTabPress = (id: TabItem['id']) => {
    setNavActiveId(id)
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme['c-main-background'] || 'rgba(18, 22, 32, 0.95)',
          borderTopColor: theme['c-border-background'] || 'rgba(255, 255, 255, 0.06)',
        },
      ]}
    >
      {TABS.map(tab => {
        const isActive = activeId === tab.id
        const color = isActive ? '#10b981' : '#6b7280'

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabBtn}
            activeOpacity={0.7}
            onPress={() => handleTabPress(tab.id)}
          >
            <View style={styles.iconWrapper}>
              <Icon name={tab.icon} size={20} color={color} />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color, fontWeight: isActive ? '700' : '500' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    backgroundColor: '#090a0f',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
})

export default BottomTabBar
