import { useRef, useEffect } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { setNavActiveId } from '@/core/common'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import SearchTypeSelector from '@/screens/Home/Views/Search/SearchTypeSelector'

export default () => {
  const activeId = useNavActiveId()
  const statusBarHeight = useStatusbarHeight()
  const theme = useTheme()
  const previousTabRef = useRef<string>('nav_songlist')

  useEffect(() => {
    if (activeId !== 'nav_search') {
      previousTabRef.current = activeId
    }
  }, [activeId])

  const handleSearchClick = () => {
    setNavActiveId('nav_search')
  }

  const handleBack = () => {
    setNavActiveId((previousTabRef.current as any) || 'nav_songlist')
  }

  const isSearchMode = activeId === 'nav_search'

  const titleMap: Record<string, string> = {
    nav_songlist: '发现音乐',
    nav_top: '巅峰榜单',
    nav_love: '我的音乐',
    nav_setting: '系统设置',
    nav_search: '全网检索',
  }

  return (
    <>
      <StatusBar />
      <View
        style={[
          styles.container,
          {
            height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
            paddingTop: statusBarHeight,
            backgroundColor: theme['c-main-background'] || '#121620',
            borderBottomColor: theme['c-border-background'] || 'rgba(255, 255, 255, 0.06)',
          },
        ]}
      >
        {isSearchMode ? (
          <View style={styles.searchHeaderRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
            >
              <Icon name="chevron-left" size={20} color="#e5e7eb" />
            </TouchableOpacity>
            <View style={styles.selectorWrapper}>
              <SearchTypeSelector />
            </View>
          </View>
        ) : (
          <View style={styles.normalHeaderRow}>
            <Text style={[styles.headerTitle, { color: theme['c-font'] || '#ffffff' }]}>{titleMap[activeId] || 'CJY 音乐'}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.searchPill}
              onPress={handleSearchClick}
            >
              <Icon name="search-2" size={14} color="#9ca3af" />
              <Text style={styles.searchPlaceholder}>搜索音乐、歌手、大碟...</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    zIndex: 10,
    borderBottomWidth: 1,
  },
  normalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 14,
  },
  searchPill: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchPlaceholder: {
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 6,
  },
  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorWrapper: {
    flex: 1,
  },
})
