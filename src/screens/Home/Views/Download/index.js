import React, { useEffect, useState } from 'react'
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { downloadManager } from '@/services/download/downloadManager'
import RNFS from 'react-native-fs'
import { toast } from '@/utils/tools'

export default () => {
  const [dir, setDir] = useState('')
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const scanFiles = async () => {
    setLoading(true)
    try {
      const currentDir = await downloadManager.getWritableDir()
      setDir(currentDir)
      const list = await RNFS.readDir(currentDir)
      const audioFiles = list.filter(f => /\.(flac|mp3|wav|m4a)$/i.test(f.name))
      setFiles(audioFiles)
    } catch (err) {
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void scanFiles()
  }, [])

  const handleOpenFile = (f: any) => {
    toast(`本地文件路径: ${f.path}`)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>本地已下载 ({files.length})</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{dir}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={scanFiles}>
          <Text style={styles.refreshText}>刷新</Text>
        </TouchableOpacity>
      </View>

      {files.length === 0 ? (
        <View style={styles.emptyBox}>
          <Icon name="download-2" size={36} color="#4b5563" />
          <Text style={styles.emptyText}>暂无已下载歌曲，可前往歌曲详情点下载</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={item => item.path}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.fileItem}
              activeOpacity={0.7}
              onPress={() => handleOpenFile(item)}
            >
              <Icon name="album" size={20} color="#10b981" />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.fileSize}>{(item.size / 1024 / 1024).toFixed(2)} MB</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090a0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
    maxWidth: 240,
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  refreshText: {
    fontSize: 12,
    color: '#e5e7eb',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  fileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#ffffff',
  },
  fileSize: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
})
