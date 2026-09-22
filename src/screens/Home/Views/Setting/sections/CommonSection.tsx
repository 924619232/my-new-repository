import { memo } from 'react'
import { View } from 'react-native'
import Section from '../components/Section'
import SubTitle from '../components/SubTitle'
import { createStyle } from '@/utils/tools'

import DrawerLayoutPosition from '../settings/Basic/DrawerLayoutPosition'
import IsShowBackBtn from '../settings/Basic/IsShowBackBtn'
import IsShowExitBtn from '../settings/Basic/IsShowExitBtn'
import IsAlwaysKeepStatusbarHeight from '../settings/Basic/IsAlwaysKeepStatusbarHeight'
import IsHomePageScroll from '../settings/Basic/IsHomePageScroll'
import IsUseSystemFileSelector from '../settings/Basic/IsUseSystemFileSelector'
import Language from '../settings/Basic/Language'
import FontSize from '../settings/Basic/FontSize'
import ShareType from '../settings/Basic/ShareType'
import Search from '../settings/Search'
import Other from '../settings/Other'
import Version from '../settings/Version'
import About from '../settings/About'

export default memo(() => {
  return (
    <View style={styles.container}>
      <Section title="⚙️ 通用与关于">
        <SubTitle title="系统与交互细节">
          <DrawerLayoutPosition />
          <IsShowBackBtn />
          <IsShowExitBtn />
          <IsAlwaysKeepStatusbarHeight />
          <IsHomePageScroll />
          <IsUseSystemFileSelector />
        </SubTitle>

        <SubTitle title="多语言与显示设置">
          <Language />
          <FontSize />
          <ShareType />
        </SubTitle>

        <Search />
        <Other />
        <Version />
        <About />
      </Section>
    </View>
  )
})

const styles = createStyle({
  container: {
    gap: 15,
  },
})
