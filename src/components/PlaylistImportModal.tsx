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
import { toNewMusicInfo } from '@/utils'
import { resolveKugouDirect } from '@/utils/kugouUniversal'
import musicSdk from '@/utils/musicSdk'

export interface PlaylistImportModalProps extends Omit<PopupProps, 'children'> {}

export interface PlaylistImportModalType {
  show: () => void
}

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

        // 1. 酷狗音乐 / GCID 歌单直连 (首选用原生补全请求头的 KugouDirect 提取全量157+首)
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

          // 酷狗本地 SDK 兜底
          if (songs.length === 0) {
            try {
              setStatusMsg('正在通过客户端原生 SDK 直连解析酷狗曲库...')
              const kgRes = await musicSdk.kg.songList.getUserListDetail(targetUrl, 1)
              if (kgRes && kgRes.list && kgRes.list.length > 0) {
                songs = kgRes.list
                if (kgRes.info?.name) listName = kgRes.info.name
              }
            } catch (err) {
              console.log('[musicSdk kg fallback error]', err)
            }
          }
        }

        // 2. 网易云音乐客户端直连解析
        else if (targetUrl.includes('163.com') || targetUrl.includes('163cn.tv')) {
          try {
            setStatusMsg('正在通过客户端直连网易云音乐解析...')
            const wyRes = await musicSdk.wy.songList.getUserListDetail(targetUrl, 1)
            if (wyRes && wyRes.list && wyRes.list.length > 0) {
              songs = wyRes.list
              if (wyRes.info?.name) listName = wyRes.info.name
            }
          } catch (err) {
            console.log('[musicSdk wy error]', err)
          }
        }

        // 3. QQ 音乐客户端直连解析
        else if (targetUrl.includes('qq.com')) {
          try {
            setStatusMsg('正在通过客户端直连QQ音乐解析...')
            const txRes = await musicSdk.tx.songList.getUserListDetail(targetUrl, 1)
            if (txRes && txRes.list && txRes.list.length > 0) {
              songs = txRes.list
              if (txRes.info?.name) listName = txRes.info.name
            }
          } catch (err) {
            console.log('[musicSdk tx error]', err)
          }
        }

        // 4. 酷我音乐客户端直连解析
        else if (targetUrl.includes('kuwo.cn')) {
          try {
            setStatusMsg('正在通过客户端直连酷我音乐解析...')
            const kwRes = await musicSdk.kw.songList.getUserListDetail(targetUrl, 1)
            if (kwRes && kwRes.list && kwRes.list.length > 0) {
              songs = kwRes.list
              if (kwRes.info?.name) listName = kwRes.info.name
            }
          } catch (err) {
            console.log('[musicSdk kw error]', err)
          }
        }

        if (songs.length > 0) {
          setStatusMsg(`解析到《${listName}》，共 ${songs.length} 首歌曲，正在收录...`)

          const normalizedSongs = songs.map(s => (s.meta ? s : toNewMusicInfo(s)))
          const listId = `userlist_${Date.now()}`
          await createUserList(listState.userList.length, [
            { id: listId, name: listName, locationUpdateTime: Date.now() },
          ])
          await addListMusics(listId, normalizedSongs, 'bottom')
          setActiveList(listId)

          toast(`成功导入歌单《${listName}》(${normalizedSongs.length}首)`)
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
          setStatusMsg(`正在全网匹配文本曲目 (${lines.length} 行)...`)
          const parsedSongs: LX.Music.MusicInfoOnline[] = []

          for (let i = 0; i < Math.min(lines.length, 100); i++) {
            const line = lines[i]
            let name = line
            let singer = ''

            if (line.includes(' - ')) {
              const parts = line.split(' - ')
              name = parts[0].trim()
              singer = parts.slice(1).join(' - ').trim()
            } else if (line.includes('《') && line.includes('》')) {
              const m = line.match(/《([^》]+)》/)
              if (m) {
                name = m[1].trim()
                singer = line.replace(m[0], '').trim()
              }
            }

            const query = `${name} ${singer}`.trim()
            let matchedSong: any = null

            // 优先通过酷我搜索真实歌曲
            try {
              const res = await musicSdk.kw.musicSearch.search(query, 1, 1)
              if (res?.list?.length > 0) {
                matchedSong = toNewMusicInfo(res.list[0])
              }
            } catch {}

            // 酷狗兜底搜索
            if (!matchedSong) {
              try {
                const kgRes = await musicSdk.kg.musicSearch.search(query, 1, 1)
                if (kgRes?.list?.length > 0) {
                  matchedSong = toNewMusicInfo(kgRes.list[0])
                }
              } catch {}
            }

            if (matchedSong) {
              parsedSongs.push(matchedSong)
            } else {
              // 无法匹配时构建带有完整 meta 的标准实体
              parsedSongs.push({
                id: `custom_txt_${Date.now()}_${i}`,
                name,
                singer: singer || '未知歌手',
                source: 'kw',
                interval: '03:30',
                meta: {
                  songId: `txt_${Date.now()}_${i}`,
                  albumName: '文本导入',
                  picUrl: null,
                  qualitys: [{ type: '128k', size: null }, { type: '320k', size: null }],
                  _qualitys: {
                    '128k': { size: null },
                    '320k': { size: null },
                  },
                },
              })
            }
          }

          if (parsedSongs.length > 0) {
            const listId = `userlist_${Date.now()}`
            const listName = `文本导入歌单 (${parsedSongs.length}首)`
            await createUserList(listState.userList.length, [
              { id: listId, name: listName, locationUpdateTime: Date.now() },
            ])
            await addListMusics(listId, parsedSongs, 'bottom')
            setActiveList(listId)

            toast(`成功导入并匹配《${listName}》`)
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
