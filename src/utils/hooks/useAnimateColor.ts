import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated } from 'react-native'


const ANIMATION_DURATION = 800

const sanitizeColor = (c?: any): string => {
  if (!c || typeof c !== 'string' || !c.trim() || c.startsWith('var(')) {
    return '#10b981'
  }
  return c
}

export const useAnimateColor = (color: string) => {
  const safeColor = sanitizeColor(color)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const anim = useMemo(() => new Animated.Value(0), [safeColor])
  const [finished, setFinished] = useState(true)
  const currentColor = useRef(safeColor)
  const nextColor = useMemo(() => safeColor, [safeColor])

  const animColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [sanitizeColor(currentColor.current), nextColor],
  })

  useEffect(() => {
    setFinished(false)
    Animated.timing(anim, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: false,
    }).start((finished) => {
      if (!finished) return
      // currentColor.current = nextColor
      setFinished(true)
    })
    requestAnimationFrame(() => {
      currentColor.current = nextColor
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextColor])

  return [animColor, finished] as const
}
