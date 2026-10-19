import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle, toast } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'

import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isAutoResumeAfterFocusGain = useSettingValue('player.isAutoResumeAfterFocusGain')
  const isHandleAudioFocus = useSettingValue('player.isHandleAudioFocus')

  const setAutoResume = (value: boolean) => {
    updateSetting({ 'player.isAutoResumeAfterFocusGain': value })
  }

  // 只有开启了焦点处理时，自动续播才有意义
  if (!isHandleAudioFocus) return null

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isAutoResumeAfterFocusGain} onChange={setAutoResume} label={t('setting_play_auto_resume_focus')} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
