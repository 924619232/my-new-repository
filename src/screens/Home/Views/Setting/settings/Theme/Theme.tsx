import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity, type ImageSourcePropType } from 'react-native'
import { setTheme } from '@/core/theme'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { updateSetting } from '@/core/common'
import { getTheme, BG_IMAGES, getAllThemes, type LocalTheme } from '@/theme/themes'
import themeState from '@/store/theme/state'
import Text from '@/components/common/Text'
import { createStyle, getIsSupportedAutoTheme } from '@/utils/tools'
import { Icon } from '@/components/common/Icon'
import ImageBackground from '@/components/common/ImageBackground'
import CheckBox from '@/components/common/CheckBox'

interface ThemeCategory {
  id: string
  name: string
  themeIds: string[]
}

const THEME_CATEGORIES: ThemeCategory[] = [
  { id: 'all', name: '全部', themeIds: [] },
  { id: 'hardware', name: '🎛️ 硬核声学', themeIds: ['obsidian_glass', 'braun_bauhaus', 'retro_walkman', 'teenage_op1'] },
  { id: 'cyber', name: '🚀 赛博未来', themeIds: ['cyberpunk_neon', 'cosmic_nebula', 'eva_mecha', 'sakura_dusk'] },
  { id: 'oriental', name: '🏯 东方雅韵', themeIds: ['song_celadon', 'bamboo_mist', 'forbidden_city'] },
  { id: 'daytime', name: '☀️ 日间雅致', themeIds: ['silk_ivory', 'monet_garden', 'okinawa_salt'] },
]

const THEME_SUBTITLES: Record<string, string> = {
  obsidian_glass: 'OLED 旗舰 · 翡翠星芒',
  silk_ivory: '皓月凝霜 · 象牙玉瓷',
  braun_bauhaus: '工业设计 · 极简橙灰',
  retro_walkman: '随身听 1980 · 暖琥珀',
  cyberpunk_neon: '银翼杀手 · 霓虹青紫',
  cosmic_nebula: '星际漫游 · 星云洋红',
  sakura_dusk: '新海诚物语 · 晚樱暮粉',
  eva_mecha: '初号机觉醒 · 泛用机甲',
  song_celadon: '千里江山 · 汝窑青翠',
  bamboo_mist: '苍翠江南 · 幽竹清风',
  forbidden_city: '紫禁朱雀 · 故宫金丹',
  teenage_op1: '合成器工程 · 灵感洋红',
  monet_garden: '塞纳睡莲 · 鸢尾靛蓝',
  okinawa_salt: '海盐薄荷 · 晴空微风',
}

interface ThemeInfo {
  themes: Readonly<LocalTheme[]>
  userThemes: LX.Theme[]
  dataPath: string
}
const initInfo: ThemeInfo = { themes: [], userThemes: [], dataPath: '' }

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const activeThemeId = useSettingValue('theme.id')
  const isAutoTheme = useSettingValue('common.isAutoTheme')
  const lightId = useSettingValue('theme.lightId') || 'silk_ivory'
  const darkId = useSettingValue('theme.darkId') || 'obsidian_glass'
  const isSupportedAutoTheme = getIsSupportedAutoTheme()

  const [themeInfo, setThemeInfo] = useState(initInfo)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    void getAllThemes().then(setThemeInfo)
  }, [])

  const currentThemeObj = useMemo(() => {
    return themeInfo.themes.find(t => t.id === activeThemeId) ||
           themeInfo.userThemes.find(t => t.id === activeThemeId) ||
           themeInfo.themes[0]
  }, [themeInfo, activeThemeId])

  const handleSelectTheme = useCallback((id: string) => {
    requestAnimationFrame(() => {
      setTheme(id)
    })
  }, [])

  const handleToggleAutoTheme = useCallback((checked: boolean) => {
    updateSetting({ 'common.isAutoTheme': checked })
    void getTheme().then(newTheme => {
      if (newTheme.id !== themeState.theme.id) {
        setTheme(newTheme.id)
      }
    })
  }, [])

  const filteredThemes = useMemo(() => {
    if (activeCategory === 'all') {
      return themeInfo.themes
    }
    const targetCat = THEME_CATEGORIES.find(c => c.id === activeCategory)
    if (!targetCat) return themeInfo.themes
    return themeInfo.themes.filter(t => targetCat.themeIds.includes(t.id))
  }, [themeInfo.themes, activeCategory])

  return (
    <View style={styles.container}>
      {/* Hero Active Banner */}
      <View style={{
        ...styles.heroCard,
        backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        borderColor: theme['c-border-background'],
      }}>
        <View style={styles.heroRow}>
          <View style={styles.heroInfo}>
            <Text size={11} color={theme['c-primary']} style={styles.heroTag}>
              {currentThemeObj?.isDark ? '🌙 当前已佩戴 · 深色主题' : '☀️ 当前已佩戴 · 浅色主题'}
            </Text>
            <Text size={17} style={styles.heroTitle} numberOfLines={1}>
              {currentThemeObj?.name || '黑曜星芒 · OLED 旗舰'}
            </Text>
            <Text size={12} color={theme['c-font-label']} style={styles.heroSubtitle}>
              {THEME_SUBTITLES[activeThemeId] || '旗舰美学定制 · 质感微动'}
            </Text>
          </View>
          <View style={{
            ...styles.heroPreviewSwatch,
            backgroundColor: theme['c-theme'] || theme['c-primary'],
            borderColor: theme['c-primary-alpha-500'],
          }}>
            <View style={{ ...styles.heroInnerDot, backgroundColor: theme['c-primary'] }} />
          </View>
        </View>

        {/* Day/Night Auto-Switch Option */}
        {isSupportedAutoTheme && (
          <View style={{ ...styles.autoThemeRow, borderTopColor: theme['c-border-background'] }}>
            <View style={styles.autoThemeInfo}>
              <Text size={13} style={styles.autoThemeTitle}>自动跟随系统昼夜模式</Text>
              <Text size={11} color={theme['c-font-label']}>
                {isAutoTheme
                  ? `日间使用「${themeInfo.themes.find(t => t.id === lightId)?.name.split(' · ')[0] || '皓月凝霜'}」，夜间使用「${themeInfo.themes.find(t => t.id === darkId)?.name.split(' · ')[0] || '黑曜星芒'}」`
                  : '开启后将依据系统白天/黑夜模式自动切换对应主题'}
              </Text>
            </View>
            <CheckBox check={isAutoTheme} onChange={handleToggleAutoTheme} />
          </View>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.categoryScroll}>
        {THEME_CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id
          return (
            <TouchableOpacity
              key={cat.id}
              style={{
                ...styles.categoryPill,
                backgroundColor: isActive ? theme['c-primary-background-active'] : 'transparent',
                borderColor: isActive ? theme['c-primary'] : theme['c-border-background'],
              }}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.7}
            >
              <Text
                size={12}
                color={isActive ? theme['c-primary-font'] : theme['c-font']}
                style={isActive ? styles.fontBold : undefined}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Themes Grid */}
      <View style={styles.themeGrid}>
        {filteredThemes.map(t => {
          const isActive = activeThemeId === t.id
          const primaryColor = t.config.themeColors['c-primary']
          const isDarkTheme = t.isDark
          const bgImage = t.config.extInfo?.['bg-image'] ? BG_IMAGES[t.config.extInfo['bg-image']] : undefined
          const subtitle = THEME_SUBTITLES[t.id] || (isDarkTheme ? '深色风格' : '浅色风格')

          return (
            <TouchableOpacity
              key={t.id}
              style={{
                ...styles.themeCard,
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: isActive ? theme['c-primary'] : theme['c-border-background'],
                borderWidth: isActive ? 2 : 1,
              }}
              activeOpacity={0.75}
              onPress={() => handleSelectTheme(t.id)}
            >
              {/* Mini UI Simulated Mockup */}
              <View style={{
                ...styles.mockupContainer,
                backgroundColor: isDarkTheme ? '#10141d' : '#f1f5f9',
              }}>
                {bgImage ? (
                  <ImageBackground source={bgImage} style={styles.mockupBg} imageStyle={{ borderRadius: 6 }}>
                    <View style={styles.mockupOverlay} />
                  </ImageBackground>
                ) : null}

                {/* Simulated Header pill */}
                <View style={styles.mockupHeader}>
                  <View style={{ ...styles.mockupDot, backgroundColor: primaryColor }} />
                  <View style={{ ...styles.mockupBar, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }} />
                  <View style={{ ...styles.mockupBadge, backgroundColor: isDarkTheme ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)' }}>
                    <Text size={9} color={isDarkTheme ? '#94a3b8' : '#64748b'}>
                      {isDarkTheme ? '🌙' : '☀️'}
                    </Text>
                  </View>
                </View>

                {/* Simulated Mini Player Capsule */}
                <View style={{
                  ...styles.mockupPlayerBar,
                  backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                  borderColor: primaryColor,
                }}>
                  <View style={{ ...styles.mockupVinyl, backgroundColor: primaryColor }} />
                  <View style={styles.mockupTrackLines}>
                    <View style={{ ...styles.mockupLine1, backgroundColor: isDarkTheme ? '#f1f5f9' : '#0f172a' }} />
                    <View style={{ ...styles.mockupLine2, backgroundColor: primaryColor }} />
                  </View>
                  <View style={{ ...styles.mockupPlayBtn, backgroundColor: primaryColor }}>
                    <Icon name="play-outline" size={8} color="#ffffff" />
                  </View>
                </View>

                {/* Active Stamp */}
                {isActive && (
                  <View style={{ ...styles.activeBadge, backgroundColor: theme['c-primary'] }}>
                    <Text size={10} color="#ffffff" style={styles.activeBadgeText}>✓ 使用中</Text>
                  </View>
                )}
              </View>

              {/* Theme Name & Metadata */}
              <View style={styles.cardInfo}>
                <Text size={13} style={styles.cardTitle} numberOfLines={1}>
                  {t.name.split(' · ')[0]}
                </Text>
                <Text size={11} color={theme['c-font-label']} numberOfLines={1} style={styles.cardSubtitle}>
                  {subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}

        {/* User Imported Themes */}
        {themeInfo.userThemes.map(ut => {
          const isActive = activeThemeId === ut.id
          const primaryColor = ut.config.themeColors['c-primary']
          return (
            <TouchableOpacity
              key={ut.id}
              style={{
                ...styles.themeCard,
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: isActive ? theme['c-primary'] : theme['c-border-background'],
                borderWidth: isActive ? 2 : 1,
              }}
              activeOpacity={0.75}
              onPress={() => handleSelectTheme(ut.id)}
            >
              <View style={{ ...styles.mockupContainer, backgroundColor: ut.isDark ? '#10141d' : '#f1f5f9' }}>
                <View style={{ ...styles.mockupPlayerBar, borderColor: primaryColor }}>
                  <View style={{ ...styles.mockupVinyl, backgroundColor: primaryColor }} />
                </View>
                {isActive && (
                  <View style={{ ...styles.activeBadge, backgroundColor: theme['c-primary'] }}>
                    <Text size={10} color="#ffffff" style={styles.activeBadgeText}>✓ 使用中</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardInfo}>
                <Text size={13} style={styles.cardTitle} numberOfLines={1}>{ut.name}</Text>
                <Text size={11} color={theme['c-font-label']}>自定义主题</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingVertical: 5,
  },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
    paddingRight: 12,
  },
  heroTag: {
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    lineHeight: 16,
  },
  heroPreviewSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  heroInnerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  autoThemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  autoThemeInfo: {
    flex: 1,
    paddingRight: 10,
  },
  autoThemeTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  fontBold: {
    fontWeight: 'bold',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  themeCard: {
    width: '48.5%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mockupContainer: {
    height: 96,
    padding: 8,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
  },
  mockupBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mockupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mockupDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  mockupBar: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
  },
  mockupBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mockupPlayerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  mockupVinyl: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  mockupTrackLines: {
    flex: 1,
    gap: 2,
  },
  mockupLine1: {
    height: 3.5,
    width: '75%',
    borderRadius: 2,
  },
  mockupLine2: {
    height: 3,
    width: '45%',
    borderRadius: 1.5,
  },
  mockupPlayBtn: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontWeight: 'bold',
  },
  cardInfo: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardSubtitle: {
    lineHeight: 14,
  },
})

