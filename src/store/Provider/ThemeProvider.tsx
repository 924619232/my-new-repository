import { memo, useEffect, useState } from 'react'

import themeState, { ThemeContext } from '../theme/state'


export default memo(({ children }: {
  children: React.ReactNode
}) => {
  const [theme, setTheme] = useState(themeState.theme)

  useEffect(() => {
    if (themeState.theme && themeState.theme.id !== theme.id) {
      setTheme(themeState.theme)
    }
    const handleUpdateTheme = (updatedTheme: LX.ActiveTheme) => {
      requestAnimationFrame(() => {
        setTheme(updatedTheme)
      })
    }
    global.state_event.on('themeUpdated', handleUpdateTheme)
    return () => {
      global.state_event.off('themeUpdated', handleUpdateTheme)
    }
  }, [theme.id])

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
})
