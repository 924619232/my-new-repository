import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, AppState, AppStateStatus } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { createUserList, addListMusics } from '@/core/list'
import listState from '@/store/list/state'

const API_RESOLVE_ENDPOINT = 'https://music.cjy.qzz.io/api/playlist/resolve'

export const ClipboardSnifferModal: React.FC = () => {
  const [visible, setVisible] = useState(false)
  const [detectedText, setDetectedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastProcessed, setLastProcessed] = useState('')

  const checkClipboard = async () => {
    try {
      const content = await Clipboard.getString()
      if (!content || content === lastProcessed) return
      
      const s = content.trim()
      const isMusicUrl = /kugou\.com|163\.com|163cn\.tv|qq\.com|kuwo\.cn|bilibili\.com|b23\.tv|gcid_/i.test(s)
      const isTextList = s.includes('\n') && (s.includes(' - ') || s.includes('《'))

      if (isMusicUrl || isTextList) {
        setDetectedText(s)
        setVisible(true)
      }
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    // Check on launch
    checkClipboard()

    // Check when returning to foreground
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkClipboard()
      }
    })
    return () => {
      sub.remove()
    }
  }, [lastProcessed])

  const handleImport = async () => {
    if (!detectedText) return
    setLoading(true)
    try {
      const resp = await fetch(`${API_RESOLVE_ENDPOINT}?url=${encodeURIComponent(detectedText)}`)
      const res = await resp.json()
      if (res.code === 200 && res.data) {
        const { title, songs } = res.data
        if (songs && songs.length > 0) {
          const listId = `userlist_${Date.now()}`
          await createUserList(listState.userList.length, [
            { id: listId, name: title || '导入歌单', locationUpdateTime: Date.now() },
          ])
          await addListMusics(listId, songs, 'bottom')
        }
      }
    } catch (err) {
      console.error('Clipboard import failed', err)
    } finally {
      setLoading(false)
      setLastProcessed(detectedText)
      setVisible(false)
    }
  }

  const handleCancel = () => {
    setLastProcessed(detectedText)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>🎵 检测到音乐歌单 / 歌曲内容</Text>
          <Text numberOfLines={3} style={styles.snippet}>{detectedText}</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={loading}>
              <Text style={styles.cancelText}>忽略</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.importBtn} onPress={handleImport} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.importText}>一键全量收录</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#11151c',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 8,
  },
  snippet: {
    fontSize: 12,
    color: '#9ca3af',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  importBtn: {
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#10b981',
  },
  importText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
})

export default ClipboardSnifferModal
