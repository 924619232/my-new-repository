import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import Popup, { type PopupType, type PopupProps } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import downloadManager, { type DownloadTaskItem, OFFLINE_LIST_ID } from '@/services/download/downloadManager'
import { setActiveList } from '@/core/list'
import { playListById } from '@/core/player/player'
import { toast, confirmDialog } from '@/utils/tools'

export interface DownloadModalProps extends Omit<PopupProps, 'children'> {}

export interface DownloadModalType {
  show: () => void
}

export default forwardRef<DownloadModalType, DownloadModalProps>((props, ref) => {
  const [visible, setVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'downloading' | 'completed'>('downloading')
  const [tasks, setTasks] = useState<DownloadTaskItem[]>([])
  const [currentDir, setCurrentDir] = useState<string>('')
  const popupRef = useRef<PopupType>(null)
  const theme = useTheme()

  const showModal = () => {
    if (visible) popupRef.current?.setVisible(true)
    else {
      setVisible(true)
      requestAnimationFrame(() => {
        popupRef.current?.setVisible(true)
      })
    }
  }

  useImperativeHandle(ref, () => ({
    show: showModal,
  }))

  useEffect(() => {
    const handleShow = () => showModal()
    global.app_event.on('showDownloadModal', handleShow)
    return () => {
      global.app_event.off('showDownloadModal', handleShow)
    }
  }, [visible])

  useEffect(() => {
    const onTasksChange = (allTasks: DownloadTaskItem[]) => {
      setTasks(allTasks)
    }
    downloadManager.addListener(onTasksChange)
    void downloadManager.getWritableDir().then(dir => setCurrentDir(dir))
    return () => {
      downloadManager.removeListener(onTasksChange)
    }
  }, [])

  if (!visible) return null

  const downloadingTasks = tasks.filter(t => t.status === 'downloading' || t.status === 'pending' || t.status === 'paused' || t.status === 'error')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  const handlePauseOrResume = (task: DownloadTaskItem) => {
    if (task.status === 'downloading') {
      downloadManager.pauseTask(task.id)
    } else if (task.status === 'paused' || task.status === 'error') {
      downloadManager.resumeTask(task.id)
    }
  }

  const handleCancel = (task: DownloadTaskItem) => {
    downloadManager.cancelTask(task.id)
    toast('已取消下载')
  }

  const handleDeleteCompleted = async (task: DownloadTaskItem) => {
    const ok = await confirmDialog({
      message: `确定要删除离线歌曲 "${task.name}" 及其本地文件吗？`,
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    if (ok) {
      downloadManager.deleteTask(task.id, true)
      toast('已删除离线歌曲')
    }
  }

  const handlePlayCompleted = (task: DownloadTaskItem) => {
    setActiveList(OFFLINE_LIST_ID)
    void playListById(OFFLINE_LIST_ID, `local_${task.id}`)
    popupRef.current?.setVisible(false)
    toast(`正在离线播放: ${task.name}`)
  }

  const handleGoToOfflineList = () => {
    setActiveList(OFFLINE_LIST_ID)
    popupRef.current?.setVisible(false)
  }

  const handleClearCompleted = async () => {
    if (completedTasks.length === 0) return
    const ok = await confirmDialog({
      message: '确定要清空已下载记录吗？(本地物理文件保留)',
      confirmButtonText: '清空',
      cancelButtonText: '取消',
    })
    if (ok) {
      downloadManager.clearCompleted()
      toast('已清空记录')
    }
  }

  return (
    <Popup ref={popupRef} title="📥 下载管理" position="bottom">
      <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
        {/* Tab 切换 */}
        <View style={[styles.tabBar, { borderBottomColor: theme['c-border-background'] }]}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'downloading' && { borderBottomColor: theme['c-primary'], borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('downloading')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'downloading' ? theme['c-primary'] : theme['c-font-label'] },
              ]}
            >
              🚀 正在下载 ({downloadingTasks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'completed' && { borderBottomColor: theme['c-primary'], borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('completed')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'completed' ? theme['c-primary'] : theme['c-font-label'] },
              ]}
            >
              📁 已完成 ({completedTasks.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 内容区 */}
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'downloading' ? (
            downloadingTasks.length === 0 ? (
              <View style={styles.emptyView}>
                <Icon name="download-2" size={42} color={theme['c-font-label']} />
                <Text style={[styles.emptyTitle, { color: theme['c-font'] }]}>暂无进行中的下载任务</Text>
                <Text style={[styles.emptySubtitle, { color: theme['c-font-label'] }]}>
                  在歌单或歌曲菜单中点击「下载」或多选批量下载
                </Text>
              </View>
            ) : (
              downloadingTasks.map(task => {
                const isDownloading = task.status === 'downloading'
                const isPaused = task.status === 'paused'
                const isError = task.status === 'error'

                return (
                  <View
                    key={task.id}
                    style={[styles.taskItem, { borderBottomColor: theme['c-border-background'] }]}
                  >
                    <View style={styles.taskInfo}>
                      <View style={styles.taskTitleRow}>
                        <Text style={[styles.taskTitle, { color: theme['c-font'] }]} numberOfLines={1}>
                          {task.name}
                        </Text>
                        <View style={[styles.badge, { backgroundColor: theme['c-primary'] }]}>
                          <Text style={styles.badgeText}>{task.quality.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={[styles.taskSinger, { color: theme['c-font-label'] }]} numberOfLines={1}>
                        {task.singer}
                      </Text>

                      {/* 进度条 */}
                      <View style={[styles.progressBarBg, { backgroundColor: theme.isDark ? '#222' : '#e0e0e0' }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${task.progress}%`,
                              backgroundColor: isError ? '#ff4d4f' : isPaused ? '#faad14' : theme['c-primary'],
                            },
                          ]}
                        />
                      </View>

                      {/* 状态文案 */}
                      <View style={styles.statusRow}>
                        <Text style={[styles.statusText, { color: isError ? '#ff4d4f' : theme['c-font-label'] }]}>
                          {isDownloading && `下载中 ${task.progress}%`}
                          {isPaused && '已暂停'}
                          {isError && `失败: ${task.error || '重试'}`}
                          {task.status === 'pending' && '排队等待中...'}
                        </Text>
                      </View>
                    </View>

                    {/* 操作按钮 */}
                    <View style={styles.taskActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => handlePauseOrResume(task)}
                      >
                        <Icon
                          name={isDownloading ? 'pause' : 'play'}
                          size={16}
                          color={theme['c-primary']}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => handleCancel(task)}
                      >
                        <Icon name="close" size={16} color={theme['c-font-label']} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })
            )
          ) : (
            completedTasks.length === 0 ? (
              <View style={styles.emptyView}>
                <Icon name="music" size={42} color={theme['c-font-label']} />
                <Text style={[styles.emptyTitle, { color: theme['c-font'] }]}>暂无已完成的离线歌曲</Text>
                <Text style={[styles.emptySubtitle, { color: theme['c-font-label'] }]}>
                  下载完成后的歌曲将保存在本地并自动同步至「📥 离线下载」歌单
                </Text>
              </View>
            ) : (
              completedTasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskItem, { borderBottomColor: theme['c-border-background'] }]}
                  onPress={() => handlePlayCompleted(task)}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskInfo}>
                    <View style={styles.taskTitleRow}>
                      <Text style={[styles.taskTitle, { color: theme['c-font'] }]} numberOfLines={1}>
                        {task.name}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: '#52c41a' }]}>
                        <Text style={styles.badgeText}>{task.quality.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={[styles.taskSinger, { color: theme['c-font-label'] }]} numberOfLines={1}>
                        {task.singer}
                      </Text>
                      {task.fileSize ? (
                        <Text style={[styles.fileSizeText, { color: theme['c-font-label'] }]}>
                          • {task.fileSize}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                      onPress={() => handlePlayCompleted(task)}
                    >
                      <Icon name="play" size={16} color={theme['c-primary']} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                      onPress={() => handleDeleteCompleted(task)}
                    >
                      <Icon name="trash-can-outline" size={16} color="#ff4d4f" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )
          )}
        </ScrollView>

        {/* 底部信息与快捷入口 */}
        <View style={[styles.footer, { borderTopColor: theme['c-border-background'] }]}>
          <View style={styles.footerLeft}>
            <Text style={[styles.footerDir, { color: theme['c-font-label'] }]} numberOfLines={1}>
              存储: {currentDir || '本地储存'}
            </Text>
          </View>
          <View style={styles.footerRight}>
            {activeTab === 'completed' && completedTasks.length > 0 ? (
              <TouchableOpacity style={styles.footerBtn} onPress={handleClearCompleted}>
                <Text style={[styles.footerBtnText, { color: theme['c-font-label'] }]}>清空记录</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.footerBtnHighlight, { backgroundColor: theme['c-primary'] }]}
              onPress={handleGoToOfflineList}
            >
              <Icon name="playlist-music" size={14} color="#fff" />
              <Text style={styles.footerBtnHighlightText}>打开离线歌单</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Popup>
  )
})

const styles = StyleSheet.create({
  container: {
    height: 480,
    display: 'flex',
    flexDirection: 'column',
  },
  tabBar: {
    flexDirection: 'row',
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 260,
  },
  emptyView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskInfo: {
    flex: 1,
    marginRight: 10,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '75%',
  },
  badge: {
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  taskSinger: {
    fontSize: 12,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  fileSizeText: {
    fontSize: 11,
    marginLeft: 4,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusRow: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLeft: {
    flex: 1,
    marginRight: 10,
  },
  footerDir: {
    fontSize: 11,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  footerBtnText: {
    fontSize: 12,
  },
  footerBtnHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  footerBtnHighlightText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
})
