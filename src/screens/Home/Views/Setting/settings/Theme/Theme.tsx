import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity, Switch, type ImageSourcePropType } from 'react-native'
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

interface ThemeCategory {
  id: string
  name: string
  themeIds: string[]
}

const THEME_CATEGORIES: ThemeCategory[] = [
  { id: 'all', name: '全部主题', themeIds: [] },
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

const THEME_STYLE_BADGES: Record<string, string> = {
  obsidian_glass: 'OLED 纯黑',
  silk_ivory: '玉瓷白',
  braun_bauhaus: '极简工业',
  retro_walkman: '复古磁带',
  cyberpunk_neon: '赛博霓虹',
  cosmic_nebula: '深空星云',
  sakura_dusk: '日漫新海',
  eva_mecha: '机甲战线',
  song_celadon: '千里江山',
  bamboo_mist: '青竹幽境',
  forbidden_city: '朱红宫阙',
  teenage_op1: '合成机控',
  monet_garden: '印象睡莲',
  okinawa_salt: '海盐清风',
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
            <View style={styles.heroBadgeRow}>
              <View style={{ ...styles.heroSparklePill, backgroundColor: theme['c-primary-alpha-200'] || 'rgba(16, 185, 129, 0.15)' }}>
                <Text size={10} color={theme['c-primary']} style={styles.heroTag}>
                  ✨ 当前装配
                </Text>
              </View>
              <Text size={11} color={theme['c-font-label']}>
                {currentThemeObj?.isDark ? '🌙 深色旗舰' : '☀️ 浅色雅致'}
              </Text>
            </View>
            <Text size={18} color={theme['c-font']} style={styles.heroTitle} numberOfLines={1}>
              {currentThemeObj?.name || '黑曜星芒 · OLED 旗舰'}
            </Text>
            <Text size={12} color={theme['c-font-label']} style={styles.heroSubtitle}>
              {THEME_SUBTITLES[activeThemeId] || '旗舰美学定制 · 质感微动'}
            </Text>
          </View>
          
          {/* Aesthetic Palette Orb */}
          <View style={{
            ...styles.heroOrbGlow,
            backgroundColor: theme['c-primary-alpha-300'] || 'rgba(16, 185, 129, 0.25)',
          }}>
            <View style={{
              ...styles.heroOrbCore,
              backgroundColor: theme['c-primary'],
            }}>
              <Icon name="check" size={18} color="#ffffff" />
            </View>
          </View>
        </View>

        {/* Day/Night Auto-Switch Option */}
        {isSupportedAutoTheme && (
          <View style={{ ...styles.autoThemeRow, borderTopColor: theme['c-border-background'] }}>
            <View style={styles.autoThemeInfo}>
              <Text size={13} color={theme['c-font']} style={styles.autoThemeTitle}>
                🌓 自动跟随系统昼夜模式
              </Text>
              <Text size={11} color={theme['c-font-label']} style={styles.autoThemeDesc}>
                {isAutoTheme
                  ? `白昼佩戴「${themeInfo.themes.find(t => t.id === lightId)?.name.split(' · ')[0] || '皓月凝霜'}」，夜间自动佩戴「${themeInfo.themes.find(t => t.id === darkId)?.name.split(' · ')[0] || '黑曜星芒'}」`
                  : '开启后将智能识别手机系统深浅色模式，自动无感切换'}
              </Text>
            </View>
            <Switch
              value={isAutoTheme}
              onValueChange={handleToggleAutoTheme}
              trackColor={{ false: theme.isDark ? '#334155' : '#cbd5e1', true: theme['c-primary'] }}
              thumbColor="#ffffff"
            />
          </View>
        )}
      </View>

      {/* Category Tabs */}
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
          const colors = t.config.themeColors || {}
          const primaryColor = colors['c-primary'] || '#10b981'
          const primaryDark = colors['c-primary-dark-100'] || primaryColor
          const mainBg = colors['c-main-background'] || (t.isDark ? '#0b0f17' : '#f8fafc')
          const fontColor = colors['c-font'] || (t.isDark ? '#f8fafc' : '#0f172a')
          const fontLabel = colors['c-font-label'] || (t.isDark ? '#94a3b8' : '#64748b')
          const isDarkTheme = t.isDark
          const bgImage = t.config.extInfo?.['bg-image'] ? BG_IMAGES[t.config.extInfo['bg-image']] : undefined
          const subtitle = THEME_SUBTITLES[t.id] || (isDarkTheme ? '深色声学风格' : '浅色纯净风格')
          const badgeText = THEME_STYLE_BADGES[t.id] || (isDarkTheme ? '深色' : '浅色')

          return (
            <TouchableOpacity
              key={t.id}
              style={{
                ...styles.themeCard,
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: isActive ? theme['c-primary'] : theme['c-border-background'],
                borderWidth: isActive ? 2 : 1,
              }}
              activeOpacity={0.8}
              onPress={() => handleSelectTheme(t.id)}
            >
              {/* 3:4 Realistic Mini Phone Mockup Showcase */}
              <View style={{
                ...styles.mockupPhone,
                backgroundColor: mainBg,
                borderColor: isActive ? primaryColor : (isDarkTheme ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),
              }}>
                {/* Background Image Wallpaper Layer */}
                {bgImage ? (
                  <ImageBackground source={bgImage} style={styles.mockupBg} imageStyle={{ borderRadius: 10 }}>
                    <View style={{ ...styles.mockupOverlay, backgroundColor: isDarkTheme ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.35)' }} />
                  </ImageBackground>
                ) : null}

                {/* 1. Mini Status Bar with Island & Clock */}
                <View style={styles.miniStatusBar}>
                  <Text size={8} color={fontLabel} style={styles.miniStatusClock}>9:41</Text>
                  <View style={{ ...styles.miniDynamicIsland, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' }} />
                  <View style={styles.miniStatusIcons}>
                    <View style={{ ...styles.miniSignalDot, backgroundColor: fontLabel }} />
                    <View style={{ ...styles.miniBatteryBar, borderColor: fontLabel }}>
                      <View style={{ ...styles.miniBatteryFill, backgroundColor: fontLabel }} />
                    </View>
                  </View>
                </View>

                {/* 2. Mini App Header Search Bar */}
                <View style={{
                  ...styles.miniSearchBar,
                  backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDarkTheme ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                }}>
                  <View style={{ ...styles.miniSearchDot, backgroundColor: primaryColor }} />
                  <View style={{ ...styles.miniSearchLine, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }} />
                  <Text size={7} color={primaryColor} style={styles.miniSearchBadge}>Hi-Res</Text>
                </View>

                {/* 3. Mini Hero Album Cover & Visual Stage */}
                <View style={{
                  ...styles.miniAlbumStage,
                  backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                }}>
                  <View style={{ ...styles.miniAlbumCover, backgroundColor: primaryColor }}>
                    <View style={styles.miniVinylHole} />
                  </View>
                  <View style={styles.miniAlbumDetails}>
                    <Text size={9} color={fontColor} style={styles.fontBold} numberOfLines={1}>
                      {t.name.split(' · ')[0]}
                    </Text>
                    <Text size={7} color={fontLabel} numberOfLines={1}>
                      {badgeText}
                    </Text>
                    <View style={styles.miniEqRow}>
                      <View style={{ ...styles.miniEqBar1, backgroundColor: primaryColor }} />
                      <View style={{ ...styles.miniEqBar2, backgroundColor: primaryColor }} />
                      <View style={{ ...styles.miniEqBar3, backgroundColor: primaryColor }} />
                      <View style={{ ...styles.miniEqBar4, backgroundColor: primaryColor }} />
                    </View>
                  </View>
                </View>

                {/* 4. Mini Song List Rows */}
                <View style={styles.miniSongList}>
                  <View style={styles.miniSongRow}>
                    <View style={{ ...styles.miniSongThumb, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
                    <View style={styles.miniSongLines}>
                      <View style={{ ...styles.miniSongTitleLine, backgroundColor: fontColor }} />
                      <View style={{ ...styles.miniSongSubLine, backgroundColor: fontLabel }} />
                    </View>
                    <View style={{ ...styles.miniSqDot, backgroundColor: primaryColor }} />
                  </View>
                  <View style={styles.miniSongRow}>
                    <View style={{ ...styles.miniSongThumb, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
                    <View style={styles.miniSongLines}>
                      <View style={{ ...styles.miniSongTitleLine, backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)' }} />
                      <View style={{ ...styles.miniSongSubLine, backgroundColor: fontLabel }} />
                    </View>
                  </View>
                </View>

                {/* 5. Mini Bottom Floating Player Capsule */}
                <View style={{
                  ...styles.miniPlayerCapsule,
                  backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                  borderColor: primaryColor,
                }}>
                  {/* Rotating Vinyl */}
                  <View style={{ ...styles.miniCapsuleVinyl, borderColor: primaryColor }}>
                    <View style={{ ...styles.miniCapsuleCenter, backgroundColor: primaryColor }} />
                  </View>

                  {/* Waveform Micro Bars */}
                  <View style={styles.miniWaveBars}>
                    <View style={{ ...styles.miniWave1, backgroundColor: primaryColor }} />
                    <View style={{ ...styles.miniWave2, backgroundColor: primaryColor }} />
                    <View style={{ ...styles.miniWave3, backgroundColor: primaryColor }} />
                  </View>

                  {/* Play Button */}
                  <View style={{ ...styles.miniPlayBtn, backgroundColor: primaryColor }}>
                    <Icon name="play-outline" size={8} color="#ffffff" />
                  </View>
                </View>

                {/* Active Watermark Badge */}
                {isActive && (
                  <View style={{ ...styles.activePhoneBadge, backgroundColor: theme['c-primary'] }}>
                    <Text size={9} color="#ffffff" style={styles.activeBadgeText}>✓ 使用中</Text>
                  </View>
                )}
              </View>

              {/* Card Bottom: Theme Identity & Color Harmony Palette */}
              <View style={styles.cardFooter}>
                <View style={styles.cardHeaderRow}>
                  <Text size={13} color={theme['c-font']} style={styles.cardTitle} numberOfLines={1}>
                    {t.name.split(' · ')[0]}
                  </Text>
                  <View style={{
                    ...styles.stylePill,
                    backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  }}>
                    <Text size={9} color={theme['c-font-label']}>
                      {isDarkTheme ? '🌙' : '☀️'} {badgeText}
                    </Text>
                  </View>
                </View>

                <Text size={11} color={theme['c-font-label']} numberOfLines={1} style={styles.cardSubtitle}>
                  {subtitle}
                </Text>

                {/* 3-Dot Color Harmony Swatches */}
                <View style={styles.colorPaletteRow}>
                  <View style={styles.swatchGroup}>
                    <View style={{ ...styles.colorDot, backgroundColor: primaryColor }} />
                    <View style={{ ...styles.colorDot, backgroundColor: primaryDark }} />
                    <View style={{ ...styles.colorDot, backgroundColor: mainBg, borderColor: isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)', borderWidth: 1 }} />
                  </View>
                  <Text size={10} color={isActive ? theme['c-primary'] : theme['c-font-label']}>
                    {isActive ? '正在生效' : '点击装配'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )
        })}

        {/* User Custom Themes */}
        {themeInfo.userThemes.map(ut => {
          const isActive = activeThemeId === ut.id
          const primaryColor = ut.config.themeColors['c-primary'] || '#10b981'
          return (
            <TouchableOpacity
              key={ut.id}
              style={{
                ...styles.themeCard,
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: isActive ? theme['c-primary'] : theme['c-border-background'],
                borderWidth: isActive ? 2 : 1,
              }}
              activeOpacity={0.8}
              onPress={() => handleSelectTheme(ut.id)}
            >
              <View style={{ ...styles.mockupPhone, backgroundColor: ut.isDark ? '#0b0f17' : '#f8fafc' }}>
                <View style={{ ...styles.miniPlayerCapsule, borderColor: primaryColor }}>
                  <View style={{ ...styles.miniCapsuleVinyl, borderColor: primaryColor }} />
                  <View style={{ ...styles.miniPlayBtn, backgroundColor: primaryColor }}>
                    <Icon name="play-outline" size={8} color="#ffffff" />
                  </View>
                </View>
                {isActive && (
                  <View style={{ ...styles.activePhoneBadge, backgroundColor: theme['c-primary'] }}>
                    <Text size={9} color="#ffffff" style={styles.activeBadgeText}>✓ 使用中</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardFooter}>
                <Text size={13} color={theme['c-font']} style={styles.cardTitle} numberOfLines={1}>{ut.name}</Text>
                <Text size={11} color={theme['c-font-label']}>用户自定义主题</Text>
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
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
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  heroSparklePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  heroTag: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    lineHeight: 16,
  },
  heroOrbGlow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOrbCore: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  autoThemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
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
  autoThemeDesc: {
    lineHeight: 15,
  },
  categoryScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
    rowGap: 16,
  },
  themeCard: {
    width: '48.5%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  // 3:4 Realistic Phone Mockup
  mockupPhone: {
    height: 196,
    padding: 8,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderWidth: 1,
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
  },
  // 1. Status Bar
  miniStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 12,
    paddingHorizontal: 2,
  },
  miniStatusClock: {
    fontWeight: '600',
  },
  miniDynamicIsland: {
    width: 28,
    height: 4,
    borderRadius: 2,
  },
  miniStatusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniSignalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  miniBatteryBar: {
    width: 10,
    height: 5,
    borderRadius: 1.5,
    borderWidth: 0.8,
    padding: 0.5,
  },
  miniBatteryFill: {
    width: 6,
    height: '100%',
    borderRadius: 0.5,
  },
  // 2. Search Bar
  miniSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    borderRadius: 8,
    borderWidth: 0.8,
    paddingHorizontal: 6,
    gap: 5,
    marginTop: 2,
  },
  miniSearchDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  miniSearchLine: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
  },
  miniSearchBadge: {
    fontWeight: 'bold',
  },
  // 3. Album Stage
  miniAlbumStage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    borderWidth: 0.8,
    gap: 6,
    marginTop: 2,
  },
  miniAlbumCover: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniVinylHole: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
  },
  miniAlbumDetails: {
    flex: 1,
    gap: 1.5,
  },
  miniEqRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 8,
    gap: 1.5,
    marginTop: 2,
  },
  miniEqBar1: { width: 2, height: 4, borderRadius: 1 },
  miniEqBar2: { width: 2, height: 8, borderRadius: 1 },
  miniEqBar3: { width: 2, height: 6, borderRadius: 1 },
  miniEqBar4: { width: 2, height: 3, borderRadius: 1 },
  // 4. Song Rows
  miniSongList: {
    gap: 4,
    marginVertical: 2,
  },
  miniSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 14,
  },
  miniSongThumb: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  miniSongLines: {
    flex: 1,
    gap: 1.5,
  },
  miniSongTitleLine: {
    width: '65%',
    height: 3,
    borderRadius: 1.5,
  },
  miniSongSubLine: {
    width: '35%',
    height: 2,
    borderRadius: 1,
  },
  miniSqDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  // 5. Floating Capsule Player
  miniPlayerCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 5,
    gap: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  miniCapsuleVinyl: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCapsuleCenter: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  miniWaveBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniWave1: { width: 2, height: 6, borderRadius: 1 },
  miniWave2: { width: 2, height: 10, borderRadius: 1 },
  miniWave3: { width: 2, height: 7, borderRadius: 1 },
  miniPlayBtn: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePhoneBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    elevation: 2,
  },
  activeBadgeText: {
    fontWeight: 'bold',
  },
  // Card Footer Info
  cardFooter: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  stylePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  cardSubtitle: {
    lineHeight: 14,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
  },
  swatchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
})
