import { useEffect, useState } from 'react'
import { View } from 'react-native'
import Text from '@/components/common/Text'
import styles from './style'
import CheckBox from '@/components/common/CheckBox'
import { getData, saveData } from '@/plugins/storage'

export const STAGE_STORAGE_KEY = 'cjy_player_stage_mode'
export type StageMode = 'vinyl' | 'cassette' | 'cd' | 'vu' | 'classic'

const STAGE_LIST: Array<{ id: StageMode; name: string }> = [
  { id: 'vinyl', name: '发烧黑胶唱机 (旋转+高保真光泽)' },
  { id: 'cassette', name: '复古磁带卡座 (双轴动态传动)' },
  { id: 'cd', name: '激光黑胶CD (全息环形动效)' },
  { id: 'vu', name: '专业双针VU表 (发烧级指针)' },
  { id: 'classic', name: '官方高清全景大碟封面' },
]

export default () => {
  const [activeMode, setActiveMode] = useState<StageMode>('vinyl')

  useEffect(() => {
    void getData<StageMode>(STAGE_STORAGE_KEY).then(saved => {
      if (saved) setActiveMode(saved)
    })
  }, [])

  const handleSelect = (mode: StageMode) => {
    setActiveMode(mode)
    void saveData(STAGE_STORAGE_KEY, mode)
    global.app_event.emit('changePlayerStageMode', mode)
  }

  return (
    <View style={styles.container}>
      <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>播放器发烧视觉风格</Text>
      <View style={styles.content}>
        <View style={styles.list}>
          {STAGE_LIST.map(({ id, name }) => (
            <CheckBox
              key={id}
              marginBottom={4}
              check={activeMode === id}
              label={name}
              onChange={() => handleSelect(id)}
              need
            />
          ))}
        </View>
      </View>
    </View>
  )
}
