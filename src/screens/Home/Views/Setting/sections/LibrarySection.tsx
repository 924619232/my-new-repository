import { memo } from 'react'
import { View } from 'react-native'
import Section from '../components/Section'
import SubTitle from '../components/SubTitle'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

import AddMusicLocationType from '../settings/List/AddMusicLocationType'
import IsClickPlayList from '../settings/List/IsClickPlayList'
import IsShowAlbumName from '../settings/List/IsShowAlbumName'
import IsShowInterval from '../settings/List/IsShowInterval'
import Download from '../settings/Download'
import Backup from '../settings/Backup'
import Sync from '../settings/Sync'

export default memo(() => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <Section title="📁 曲库与全量导入">
        {/* Decentralized Direct Import Info Banner */}
        <View style={{
          ...styles.bannerCard,
          backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(5, 150, 105, 0.06)',
          borderColor: theme['c-primary-alpha-400'],
        }}>
          <View style={styles.bannerHeader}>
            <Text size={15} style={styles.bannerTitle} color={theme['c-primary']}>⚡ 100% 客户端本地去中心化解析</Text>
            <View style={{ ...styles.badge, backgroundColor: theme['c-primary'] }}>
              <Text size={10} color="#ffffff" style={styles.badgeText}>极速直连</Text>
            </View>
          </View>
          <Text size={12} color={theme['c-font-label']} style={styles.bannerDesc}>
            支持酷狗 GCID 短链/长链歌单全量 150+ 首直接识别、网易云、QQ音乐、酷我等全平台歌单直接在手机端本地秒级解析，零跨洋 VPS 转发中转、零频控拦截。可在首页「我的音乐」顶部搜索栏右侧或侧边栏点击导入。
          </Text>
        </View>

        <SubTitle title="曲库列表显示与排序">
          <AddMusicLocationType />
          <IsClickPlayList />
          <IsShowAlbumName />
          <IsShowInterval />
        </SubTitle>

        <Download />
        <Backup />
        <Sync />
      </Section>
    </View>
  )
})

const styles = createStyle({
  container: {
    gap: 15,
  },
  bannerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 15,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bannerTitle: {
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontWeight: 'bold',
  },
  bannerDesc: {
    lineHeight: 18,
  },
})
