import { useRef } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import ListMenu, { type ListMenuType } from './ListMenu'
import ListNameEdit, { type ListNameEditType } from './ListNameEdit'
import List from './List'
import ListImportExport, { type ListImportExportType } from './ListImportExport'
import { handleRemove, handleSync } from './listAction'
import ListMusicSort, { type ListMusicSortType } from './ListMusicSort'
import DuplicateMusic, { type DuplicateMusicType } from './DuplicateMusic'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'

interface Props {
  onBackToSongs?: () => void
}

export default ({ onBackToSongs }: Props) => {
  const theme = useTheme()
  const listMenuRef = useRef<ListMenuType>(null)
  const listNameEditRef = useRef<ListNameEditType>(null)
  const listMusicSortRef = useRef<ListMusicSortType>(null)
  const duplicateMusicRef = useRef<DuplicateMusicType>(null)
  const listImportExportRef = useRef<ListImportExportType>(null)

  const handleBack = () => {
    if (onBackToSongs) onBackToSongs()
    else global.app_event.changeLoveListVisible(false)
  }

  const handleCreate = () => {
    listNameEditRef.current?.showCreate(0)
  }

  const handleImport = () => {
    global.app_event.showPlaylistImportModal()
  }

  return (
    <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
      {/* 现代歌单管理顶部栏 */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme['c-content-background'],
            borderBottomColor: theme['c-border-background'],
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Icon name="chevron-left" size={18} color={theme['c-font']} />
          <Text style={[styles.backText, { color: theme['c-font'] }]}>返回歌曲</Text>
        </TouchableOpacity>

        <Text style={styles.title}>我的歌单</Text>

        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.pillBtn} onPress={handleCreate}>
            <Text style={styles.pillText}>+新建</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillBtn, styles.importBtn]} onPress={handleImport}>
            <Text style={[styles.pillText, styles.importText]}>+导入歌单</Text>
          </TouchableOpacity>
        </View>
      </View>

      <List onShowMenu={(info, position) => listMenuRef.current?.show(info, position)} />
      <ListNameEdit ref={listNameEditRef} />
      <ListMusicSort ref={listMusicSortRef} />
      <DuplicateMusic ref={duplicateMusicRef} />
      <ListImportExport ref={listImportExportRef} />
      <ListMenu
        ref={listMenuRef}
        onNew={index => listNameEditRef.current?.showCreate(index)}
        onRename={info => listNameEditRef.current?.show(info)}
        onSort={info => listMusicSortRef.current?.show(info)}
        onDuplicateMusic={info => duplicateMusicRef.current?.show(info)}
        onImport={(info, position) => listImportExportRef.current?.import(info, position)}
        onExport={(info, position) => listImportExportRef.current?.export(info, position)}
        onRemove={info => { handleRemove(info) }}
        onSync={info => { handleSync(info) }}
        onSelectLocalFile={(info, position) => listImportExportRef.current?.selectFile(info, position)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#e5e7eb',
    fontSize: 13,
    marginLeft: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillText: {
    fontSize: 12,
    color: '#e5e7eb',
  },
  importBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  importText: {
    color: '#34d399',
    fontWeight: 'bold',
  },
})
