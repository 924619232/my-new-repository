import { memo } from 'react'

import Theme from './Theme'
import IsHideBgDark from './IsHideBgDark'
import IsDynamicBg from './IsDynamicBg'
import IsFontShadow from './IsFontShadow'

export default memo(() => {
  return (
    <>
      <Theme />
      <IsHideBgDark />
      <IsDynamicBg />
      <IsFontShadow />
    </>
  )
})

