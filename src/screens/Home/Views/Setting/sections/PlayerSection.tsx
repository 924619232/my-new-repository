import { memo } from 'react'
import { View } from 'react-native'
import Section from '../components/Section'
import SubTitle from '../components/SubTitle'
import { createStyle } from '@/utils/tools'

import PlayHighQuality from '../settings/Player/PlayHighQuality'
import IsHandleAudioFocus from '../settings/Player/IsHandleAudioFocus'
import IsEnableAudioOffload from '../settings/Player/IsEnableAudioOffload'
import IsSavePlayTime from '../settings/Player/IsSavePlayTime'
import IsAutoCleanPlayedList from '../settings/Player/IsAutoCleanPlayedList'
import MaxCache from '../settings/Player/MaxCache'
import IsShowLyricTranslation from '../settings/Player/IsShowLyricTranslation'
import IsShowLyricRoma from '../settings/Player/IsShowLyricRoma'
import IsS2T from '../settings/Player/IsS2T'
import IsShowBluetoothLyric from '../settings/Player/IsShowBluetoothLyric'
import IsShowBluetoothFullLyric from '../settings/Player/IsShowBluetoothFullLyric'
import IsShowNotificationImage from '../settings/Player/IsShowNotificationImage'

import Source from '../settings/Basic/Source'
import SourceName from '../settings/Basic/SourceName'
import IsStartupAutoPlay from '../settings/Basic/IsStartupAutoPlay'
import IsStartupPushPlayDetailScreen from '../settings/Basic/IsStartupPushPlayDetailScreen'
import IsAllowProgressBarSeek from '../settings/Basic/IsAllowProgressBarSeek'
import IsAutoHidePlayBar from '../settings/Basic/IsAutoHidePlayBar'

export default memo(() => {
  return (
    <View style={styles.container}>
      <Section title="🎧 播放与音质引擎">
        <SubTitle title="音频规格与音质选择">
          <PlayHighQuality />
          <IsHandleAudioFocus />
          <IsEnableAudioOffload />
        </SubTitle>

        <SubTitle title="音源服务与自定义接口">
          <Source />
          <SourceName />
        </SubTitle>

        <SubTitle title="播放控制与交互偏好">
          <IsStartupAutoPlay />
          <IsStartupPushPlayDetailScreen />
          <IsSavePlayTime />
          <IsAllowProgressBarSeek />
          <IsAutoHidePlayBar />
          <IsAutoCleanPlayedList />
          <MaxCache />
        </SubTitle>

        <SubTitle title="歌词渲染与外设同步">
          <IsShowLyricTranslation />
          <IsShowLyricRoma />
          <IsS2T />
          <IsShowBluetoothLyric />
          <IsShowBluetoothFullLyric />
          <IsShowNotificationImage />
        </SubTitle>
      </Section>
    </View>
  )
})

const styles = createStyle({
  container: {
    gap: 15,
  },
})
