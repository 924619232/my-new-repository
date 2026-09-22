import { memo } from 'react'
import { View } from 'react-native'
import Theme from '../settings/Theme/Theme'
import IsHideBgDark from '../settings/Theme/IsHideBgDark'
import IsDynamicBg from '../settings/Theme/IsDynamicBg'
import IsFontShadow from '../settings/Theme/IsFontShadow'
import LyricDesktop from '../settings/LyricDesktop'
import Section from '../components/Section'
import SubTitle from '../components/SubTitle'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  return (
    <View style={styles.container}>
      <Section title="🎨 个性化装扮与主题中心">
        <Theme />
        <SubTitle title="视觉与沉浸效果">
          <IsHideBgDark />
          <IsDynamicBg />
          <IsFontShadow />
        </SubTitle>
        <LyricDesktop />
      </Section>
    </View>
  )
})

const styles = createStyle({
  container: {
    gap: 15,
  },
})
