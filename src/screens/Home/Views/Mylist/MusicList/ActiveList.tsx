import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useActiveListId, useListFetching } from '@/store/list/hook'
import listState from '@/store/list/state'
import { getListPrevSelectId } from '@/utils/data'
import { setActiveList, getListMusics } from '@/core/list'
import { playList } from '@/core/player/player'
import { toast } from '@/utils/tools'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import Loading from '@/components/common/Loading'
import { useSettingValue } from '@/store/setting/hook'

export interface ActiveListProps {
  onShowSearchBar: () => void
  onScrollToTop: () => void
}
export interface ActiveListType {
  setVisibleBar: (visible: boolean) => void
}

export default forwardRef<ActiveListType, ActiveListProps>(({ onShowSearchBar, onScrollToTop }, ref) => {
  const currentListId = useActiveListId()
  const fetching = useListFetching(currentListId)
  const langId = useSettingValue('common.langId')
  const theme = useTheme()
  const currentListName = useMemo(() => {
    switch (currentListId) {
      case LIST_IDS.TEMP:
        return global.i18n.t('list_name_temp')
      case LIST_IDS.DEFAULT:
        return global.i18n.t('list_name_default')
      case LIST_IDS.LOVE:
        return global.i18n.t('list_name_love')
      default:
        return listState.allList.find(l => l.id === currentListId)?.name ?? ''
    }
  }, [currentListId, langId])
  const [visibleBar, setVisibleBar] = useState(true)

  useImperativeHandle(ref, () => ({
    setVisibleBar(visible) {
      setVisibleBar(visible)
    },
  }))

  const showList = () => {
    global.app_event.changeLoveListVisible(true)
  }

  const handlePlayAll = async() => {
    const musics = await getListMusics(currentListId)
    if (!musics.length) {
      toast('当前列表为空')
      return
    }
    setActiveList(currentListId)
    void playList(currentListId, 0)
    toast(`已切换至【${currentListName}】并开始播放`)
  }

  useEffect(() => {
    void getListPrevSelectId().then((id) => {
      setActiveList(id)
    })
  }, [])

  return (
    <View
      style={[
        styles.container,
        {
          opacity: visibleBar ? 1 : 0,
          backgroundColor: theme['c-content-background'],
          borderBottomColor: theme['c-border-background'],
        },
      ]}
    >
      <TouchableOpacity
        onPress={showList}
        onLongPress={onScrollToTop}
        style={styles.listSwitchBtn}
        activeOpacity={0.7}
      >
        <Text style={[styles.listNameText, { color: theme['c-font'] }]} numberOfLines={1}>
          {currentListName}
        </Text>
        <Icon name="dots-vertical" size={14} color={theme['c-primary']} />
        {fetching ? <Loading color={theme['c-primary']} style={styles.loading} /> : null}
      </TouchableOpacity>

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={[
            styles.playAllBtn,
            {
              backgroundColor: theme.isDark ? 'rgba(7, 197, 86, 0.15)' : 'rgba(7, 197, 86, 0.1)',
              borderColor: theme['c-primary'],
            },
          ]}
          onPress={() => void handlePlayAll()}
          activeOpacity={0.7}
        >
          <Icon name="play" size={12} color={theme['c-primary']} />
          <Text style={[styles.playAllBtnText, { color: theme['c-primary'] }]}>
            播放全部
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.importBtn,
            {
              backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
          onPress={() => global.app_event.showDownloadModal()}
          activeOpacity={0.7}
        >
          <Icon name="download-2" size={12} color={theme['c-primary']} />
          <Text style={[styles.importBtnText, { color: theme['c-font'] }]}>
            下载
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.importBtn,
            {
              backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
          onPress={() => global.app_event.showPlaylistImportModal()}
          activeOpacity={0.7}
        >
          <Icon name="download-2" size={12} color={theme['c-primary']} />
          <Text style={[styles.importBtnText, { color: theme['c-font'] }]}>
            导入
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  listSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  listNameText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 6,
  },
  loading: {
    marginLeft: 6,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
  },
  playAllBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
  },
  importBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
