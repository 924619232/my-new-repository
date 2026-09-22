import { memo, useRef, useState, useCallback } from 'react'
import { View, ScrollView } from 'react-native'
import NavList from './NavList'
import ThemeSection from '../sections/ThemeSection'
import PlayerSection from '../sections/PlayerSection'
import LibrarySection from '../sections/LibrarySection'
import CommonSection from '../sections/CommonSection'
import { createStyle } from '@/utils/tools'
import { type SettingScreenIds } from '../Main'

const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15,
    paddingBottom: 25,
  },
})

export default memo(() => {
  const [activeId, setActiveId] = useState<SettingScreenIds>(global.lx.settingActiveId || 'theme')
  const scrollRef = useRef<ScrollView>(null)

  const handleChangeId = useCallback((id: SettingScreenIds) => {
    setActiveId(id)
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [])

  return (
    <View style={styles.container}>
      <NavList onChangeId={handleChangeId} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="always"
      >
        {activeId === 'player' && <PlayerSection />}
        {activeId === 'library' && <LibrarySection />}
        {activeId === 'common' && <CommonSection />}
        {activeId === 'theme' && <ThemeSection />}
      </ScrollView>
    </View>
  )
})

