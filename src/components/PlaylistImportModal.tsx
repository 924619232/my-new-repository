import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import Popup, { type PopupType, type PopupProps } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { createUserList, addListMusics, setActiveList } from '@/core/list'
import listState from '@/store/list/state'
import { toast } from '@/utils/tools'
import { resolveKugouDirect } from '@/utils/kugouUniversal'

export interface PlaylistImportModalProps extends Omit<PopupProps, 'children'> {}

export interface PlaylistImportModalType {
  show: () => void
}

const API_RESOLVE_ENDPOINT = 'https://music.cjy.qzz.io/api/playlist/resolve'

export default forwardRef<PlaylistImportModalType, PlaylistImportModalProps>((props, ref) => {
  const [visible, setVisible] = useState(false)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
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
    global.app_event.on('showPlaylistImportModal', handleShow)
    return () => {
      global.app_event.off('showPlaylistImportModal', handleShow)
    }
  }, [visible])

  if (!visible) return null

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getString()
      if (text) {
        setInputText(text.trim())
        toast('已从剪贴板粘贴')
      } else {
        toast('剪贴板为空')
      }
    } catch (e) {
      toast('无法读取剪贴板')
    }
  }

  const handleClear = () => {
    setInputText('')
    setStatusMsg('')
  }

  const handleImport = async () => {
    const text = inputText.trim()
    if (!text) {
      toast('请先输入或粘贴歌单链接/文本')
      return
    }

    setLoading(true)
    setStatusMsg('正在智能解析外部歌单...')

    try {
      // 1. Check if URL
      const isUrl = /https?:\/\/[^\s]+/i.test(text)
      if (isUrl) {
        const urlMatch = text.match(/https?:\/\/[^\s]+/i)
        const targetUrl = urlMatch ? urlMatch[0] : text

        let songs: any[] = []
        let listName = '导入外部歌单'

        // 1. 优先通过客户端国内极速直连解析酷狗歌单 (突破海外频控，全量157首秒级入库)
        if (targetUrl.includes('kugou.com') || targetUrl.includes('gcid_')) {
          try {
            setStatusMsg('正在通过客户端国内直连全量提取酷狗曲库 (突破10首限制)...')
            const directRes = await resolveKugouDirect(targetUrl)
            if (directRes && directRes.songs && directRes.songs.length > 0) {
              songs = directRes.songs
              if (directRes.title) listName = directRes.title
            }
          } catch (err) {
            console.log('[Kugou client direct error]', err)
          }
        }

        // 2. 服务端聚合解析兜底 (网易云/QQ音乐/酷我等)
        if (songs.length === 0) {
          try {
            setStatusMsg('正在连接云端音源解析中枢...')
            const resp = await fetch(`${API_RESOLVE_ENDPOINT}?url=${encodeURIComponent(targetUrl)}`)
            const res = await resp.json()
            if (res.code === 200 && res.data && Array.isArray(res.data.songs)) {
              songs = res.data.songs
              if (res.data.title) listName = res.data.title
            }
          } catch (e) {
            console.log('[API_RESOLVE error]', e)
          }
        }

        if (songs.length > 0) {
          setStatusMsg(`解析到《${listName}》，共 ${songs.length} 首歌曲，正在收录...`)

          const listId = `userlist_${Date.now()}`
          await createUserList(listState.userList.length, [
            { id: listId, name: listName, locationUpdateTime: Date.now() },
          ])
          await addListMusics(listId, songs, 'bottom')
          setActiveList(listId)

          toast(`成功导入歌单《${listName}》(${songs.length}首)`)
          setStatusMsg('')
          setInputText('')
          popupRef.current?.setVisible(false)
          return
        } else {
          toast('未能解析该链接中的歌曲，请确保歌单链接公开有效')
          setStatusMsg('解析失败，请检查链接有效性')
          setLoading(false)
          return // 严格拦截：链接解析失败绝不向后走纯文本逻辑，杜绝产生假单曲！
        }
      } else {
        // Multi-line text import fallback
        const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean)
        if (lines.length > 0) {
          setStatusMsg(`正在解析文本歌单 (${lines.length} 行)...`)
          const parsedSongs: LX.Music.MusicInfoOnline[] = []

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            let name = line
            let singer = '未知歌手'

            if (line.includes(' - ')) {
              const parts = line.split(' - ')
              name = parts[0].trim()
              singer = parts.slice(1).join(' - ').trim()
            } else if (line.includes('《') && line.includes('》')) {
              const m = line.match(/《([^》]+)》/)
              if (m) {
                name = m[1].trim()
                singer = line.replace(m[0], '').trim() || '未知歌手'
              }
            }

            parsedSongs.push({
              id: `custom_txt_${Date.now()}_${i}`,
              name,
              singer,
              source: 'kw',
              interval: '03:30',
              meta: {
                songId: `txt_${Date.now()}_${i}`,
                albumName: '文本导入',
                qualitys: [{ type: '128k', size: '3.5M' }, { type: '320k', size: '8.5M' }, { type: 'flac', size: '25M' }],
                _qualitys: {
                  '128k': { size: '3.5M' },
                  '320k': { size: '8.5M' },
                  'flac': { size: '25M' },
                },
              },
            })
          }

          if (parsedSongs.length > 0) {
            const listId = `userlist_${Date.now()}`
            const listName = `文本导入歌单 (${parsedSongs.length}首)`
            await createUserList(listState.userList.length, [
              { id: listId, name: listName, locationUpdateTime: Date.now() },
            ])
            await addListMusics(listId, parsedSongs, 'bottom')
            setActiveList(listId)

            toast(`成功导入《${listName}》`)
            setStatusMsg('')
            setInputText('')
            popupRef.current?.setVisible(false)
            return
          }
        }
        toast('未能识别文本内容，请按“歌名 - 歌手”格式输入')
        setStatusMsg('')
      }
    } catch (err: any) {
      toast(`导入失败: ${err.message || '网络异常'}`)
      setStatusMsg(`请求出错: ${err.message || '网络连接异常'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popup ref={popupRef} title="全网外部歌单智能导入" {...props}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View onStartShouldSetResponder={() => true} style={styles.content}>
          <Text size={12} color={theme['c-font-label']} style={styles.subtitle}>
            支持粘贴 QQ音乐、网易云、酷狗、酷我、B站 分享链接或“歌名 - 歌手”文本
          </Text>

          <View style={[styles.inputBox, { borderColor: theme['c-border-background'] }]}>
            <TextInput
              style={[styles.input, { color: theme['c-font'] }]}
              placeholder="在此长按粘贴外部歌单链接或文本..."
              placeholderTextColor={theme['c-font-label']}
              multiline
              numberOfLines={4}
              value={inputText}
              onChangeText={setInputText}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.quickBar}>
            <TouchableOpacity style={styles.pillBtn} onPress={handlePaste}>
              <Text size={12} color="#10b981">📋 一键粘贴剪贴板</Text>
            </TouchableOpacity>
            {inputText.length > 0 && (
              <TouchableOpacity style={styles.pillBtn} onPress={handleClear}>
                <Text size={12} color={theme['c-font-label']}>清空</Text>
              </TouchableOpacity>
            )}
          </View>

          {statusMsg.length > 0 && (
            <View style={styles.statusBox}>
              <Text size={12} color="#10b981">{statusMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.btnDisabled]}
            onPress={handleImport}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text size={15} style={styles.submitText}>开始全量智能解析并收录</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Popup>
  )
})

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  subtitle: {
    marginBottom: 12,
    lineHeight: 18,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#0f172a30',
    padding: 10,
    marginBottom: 10,
  },
  input: {
    fontSize: 13,
    minHeight: 80,
  },
  quickBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#10b98115',
    borderWidth: 1,
    borderColor: '#10b98130',
  },
  statusBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#10b98115',
    marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
})
