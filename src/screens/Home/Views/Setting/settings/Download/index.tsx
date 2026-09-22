import React, { useEffect, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native'
import Text from '@/components/common/Text'
import { downloadManager } from '@/services/download/downloadManager'
import { toast } from '@/utils/tools'
import RNFS from 'react-native-fs'

const PRESETS = [
  { label: '系统音乐主目录', path: '/storage/emulated/0/Music/CJYMusic' },
  { label: '系统下载目录', path: `${RNFS.DownloadDirectoryPath}/CJYMusic` },
  { label: '应用外置存储', path: `${RNFS.ExternalDirectoryPath}/Music` },
]

export default () => {
  const [currentPath, setCurrentPath] = useState('')
  const [inputPath, setInputPath] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    void downloadManager.getWritableDir().then(dir => {
      setCurrentPath(dir)
      setInputPath(dir)
    })
  }, [])

  const handleApplyPreset = async (presetPath: string) => {
    setInputPath(presetPath)
    const ok = await downloadManager.setCustomDir(presetPath)
    if (ok) {
      setCurrentPath(presetPath)
      setStatusMsg(`已切换并验证目录：${presetPath}`)
      toast('下载目录已更新')
    } else {
      setStatusMsg(`该目录无写入权限，请重试`)
      toast('目录写入权限探测失败')
    }
  }

  const handleTestAndSave = async () => {
    const target = inputPath.trim()
    if (!target) {
      toast('路径不能为空')
      return
    }
    const ok = await downloadManager.setCustomDir(target)
    if (ok) {
      setCurrentPath(target)
      setStatusMsg(`测试成功！有效下载路径已生效：\n${target}`)
      toast('下载路径已成功保存')
    } else {
      setStatusMsg(`写入测试失败，系统拒绝创建或写入：\n${target}`)
      toast('无法写入该路径，请检查权限')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>本地无损音频存储目录</Text>
      <Text style={styles.headerSubtitle}>
        当前有效生效路径：
      </Text>
      <View style={styles.currentPathBox}>
        <Text style={styles.currentPathText} numberOfLines={2}>
          {currentPath || '正在探测...'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>快速选择推荐存储位置：</Text>
      <View style={styles.presetRow}>
        {PRESETS.map((p, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.presetBtn,
              currentPath === p.path && styles.presetBtnActive,
            ]}
            onPress={() => handleApplyPreset(p.path)}
          >
            <Text
              style={[
                styles.presetBtnText,
                currentPath === p.path && styles.presetBtnTextActive,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>自定义输入绝对存储路径：</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.textInput}
          value={inputPath}
          onChangeText={setInputPath}
          placeholder="输入本地绝对路径，例如 /storage/emulated/0/Music/..."
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleTestAndSave} activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>测试写入权限并立即保存</Text>
      </TouchableOpacity>

      {statusMsg.length > 0 && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{statusMsg}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
  },
  currentPathBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10b981',
    marginBottom: 12,
  },
  currentPathText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    color: '#e5e7eb',
    marginBottom: 8,
    marginTop: 4,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  presetBtnText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  presetBtnTextActive: {
    color: '#34d399',
    fontWeight: 'bold',
  },
  inputBox: {
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  textInput: {
    height: 40,
    color: '#ffffff',
    fontSize: 13,
  },
  saveBtn: {
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  statusText: {
    color: '#9ca3af',
    fontSize: 11,
  },
})
