import themeActions from '@/store/theme/action'
import { getTheme, themes } from '@/theme/themes'
import { updateSetting } from './common'
import themeState from '@/store/theme/state'

export const setShouldUseDarkColors = (shouldUseDarkColors: boolean) => {
  themeActions.setShouldUseDarkColors(shouldUseDarkColors)
}

export const applyTheme = (theme: LX.Theme) => {
  themeActions.setTheme(theme)
}

export const setTheme = (id: string) => {
  const targetTheme = themes.find(t => t.id === id)
  const updates: Partial<LX.AppSetting> = { 'theme.id': id }
  if (targetTheme) {
    if (targetTheme.isDark) {
      updates['theme.darkId'] = id
    } else {
      updates['theme.lightId'] = id
    }
  }
  updateSetting(updates)
  void getTheme().then(theme => {
    if (theme.id == themeState.theme.id) return
    applyTheme(theme)
  })
}

