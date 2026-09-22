import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import ThemeSection from './sections/ThemeSection'
import PlayerSection from './sections/PlayerSection'
import LibrarySection from './sections/LibrarySection'
import CommonSection from './sections/CommonSection'

export const SETTING_SCREENS = [
  'theme',
  'player',
  'library',
  'common',
] as const

export type SettingScreenIds = typeof SETTING_SCREENS[number]

export interface MainType {
  setActiveId: (id: SettingScreenIds) => void
}

const Main = forwardRef<MainType, {}>((props, ref) => {
  const [id, setId] = useState(global.lx.settingActiveId)

  useImperativeHandle(ref, () => ({
    setActiveId(id) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setId(id)
        })
      })
    },
  }))

  const component = useMemo(() => {
    switch (id) {
      case 'player': return <PlayerSection />
      case 'library': return <LibrarySection />
      case 'common': return <CommonSection />
      case 'theme':
      default: return <ThemeSection />
    }
  }, [id])

  return component
})

export default Main

