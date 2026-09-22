import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
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

  const handleSearchClick = () => {
    setNavActiveId('nav_search')
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
          },
        ]}
      >
        {isSearchMode ? (
          <View style={styles.searchHeaderRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setNavActiveId('nav_songlist')}
            >
              <Icon name="chevron-left" size={20} color="#e5e7eb" />
            </TouchableOpacity>
            <View style={styles.selectorWrapper}>
              <SearchTypeSelector />
            </View>
          </View>
        ) : (
          <View style={styles.normalHeaderRow}>
            <Text style={styles.headerTitle}>{titleMap[activeId] || 'CJY 音乐'}</Text>
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
    backgroundColor: '#090a0f',
    paddingHorizontal: 12,
    justifyContent: 'center',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
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
