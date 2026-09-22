import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useActiveListId, useListFetching } from '@/store/list/hook'
import listState from '@/store/list/state'
import { getListPrevSelectId } from '@/utils/data'
import { setActiveList } from '@/core/list'
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
          backgroundColor: theme['c-main-background'] || '#0a0d14',
          borderBottomColor: theme['c-border-background'] || 'rgba(255, 255, 255, 0.08)',
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
            styles.importBtn,
            {
              backgroundColor: theme['c-primary-alpha-200'] || 'rgba(16, 185, 129, 0.15)',
              borderColor: theme['c-primary'],
            },
          ]}
          onPress={() => global.app_event.showPlaylistImportModal()}
          activeOpacity={0.8}
        >
          <Text style={[styles.importBtnText, { color: theme['c-primary-font-active'] || theme['c-primary'] }]}>
            +导入歌单
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
    gap: 8,
  },
  importBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  importBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  iconBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
