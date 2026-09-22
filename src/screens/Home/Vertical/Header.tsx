import { useRef, useEffect, useState } from 'react'
import { View, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { setNavActiveId } from '@/core/common'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import { setSearchText, addHistoryWord } from '@/core/search/search'

export default () => {
  const activeId = useNavActiveId()
  const statusBarHeight = useStatusbarHeight()
  const theme = useTheme()
  const previousTabRef = useRef<string>('nav_songlist')
  const [inputText, setInputText] = useState('')

  useEffect(() => {
    if (activeId !== 'nav_search') {
      previousTabRef.current = activeId
    }
  }, [activeId])

  const handleSearchClick = () => {
    setNavActiveId('nav_search')
  }

  const handleBack = () => {
    setInputText('')
    setNavActiveId((previousTabRef.current as any) || 'nav_songlist')
  }

  const handleTextChange = (text: string) => {
    setInputText(text)
    global.app_event.tipSearch(text.trim())
  }

  const handleSubmitSearch = () => {
    const text = inputText.trim()
    if (!text) return
    setSearchText(text)
    void addHistoryWord(text)
    global.app_event.search(text)
  }

  const handleClear = () => {
    setInputText('')
    global.app_event.tipSearch('')
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
            backgroundColor: theme['c-main-background'],
            borderBottomColor: theme['c-border-background'],
          },
        ]}
      >
        {isSearchMode ? (
          <View style={styles.searchHeaderRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="chevron-left" size={24} color={theme['c-font']} />
            </TouchableOpacity>
            <View style={[
              styles.searchField,
              {
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: theme['c-border-background'],
              },
            ]}>
              <Icon name="search-2" size={15} color={theme['c-font-label']} />
              <TextInput
                style={[styles.searchInput, { color: theme['c-font'] }]}
                placeholder="搜索音乐、歌手、大碟..."
                placeholderTextColor={theme['c-font-label']}
                value={inputText}
                onChangeText={handleTextChange}
                onSubmitEditing={handleSubmitSearch}
                returnKeyType="search"
                autoFocus
              />
              {inputText ? (
                <TouchableOpacity onPress={handleClear} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close" size={13} color={theme['c-font-label']} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity onPress={handleSubmitSearch} style={styles.searchSubmitBtn} activeOpacity={0.7}>
              <Text style={[styles.searchSubmitText, { color: theme['c-primary'] }]}>搜索</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.normalHeaderRow}>
            {activeId === 'nav_songlist' || activeId === 'nav_top' ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.searchCapsule,
                  {
                    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
                onPress={handleSearchClick}
              >
                <Icon name="search-2" size={15} color={theme['c-primary']} />
                <Text style={[styles.searchCapsulePlaceholder, { color: theme['c-font-label'] }]} numberOfLines={1}>
                  搜索歌曲、歌手、专辑...
                </Text>
                <View style={[styles.searchCapsuleBadge, { backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)' }]}>
                  <Text style={[styles.searchCapsuleBadgeText, { color: theme['c-primary'] }]}>Hi-Res</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={[styles.headerTitle, { color: theme['c-font'] || '#ffffff' }]}>
                  {titleMap[activeId] || 'CJY 音乐'}
                </Text>
                {activeId !== 'nav_setting' ? (
                  <View style={styles.rightActionRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.headerRoundBtn,
                        {
                          backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                      onPress={handleSearchClick}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="search-2" size={16} color={theme['c-font'] || '#ffffff'} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            )}
          </View>
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  normalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  searchCapsule: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchCapsulePlaceholder: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
  },
  searchCapsuleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  searchCapsuleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerRoundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchField: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: 13,
    paddingVertical: 0,
    paddingHorizontal: 6,
  },
  clearBtn: {
    padding: 4,
  },
  searchSubmitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  searchSubmitText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  rightActionRow: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
})
