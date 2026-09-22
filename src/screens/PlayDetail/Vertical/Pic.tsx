import { useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity, Text } from 'react-native'
import { createStyle } from '@/utils/tools'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import VinylStage from '@/views/Player/Stages/VinylStage'
import CassetteStage from '@/views/Player/Stages/CassetteStage'
import LaserCdStage from '@/views/Player/Stages/LaserCdStage'
import VuMeterStage from '@/views/Player/Stages/VuMeterStage'
import { getData, saveData } from '@/plugins/storage'

const STAGE_STORAGE_KEY = 'player_stage_mode'
type StageMode = 'vinyl' | 'cassette' | 'cd' | 'vu' | 'classic'

export default ({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlaying = useIsPlay()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)
  const [stageMode, setStageMode] = useState<StageMode>('vinyl')

  useEffect(() => {
    void getData<StageMode>(STAGE_STORAGE_KEY).then(saved => {
      if (saved) setStageMode(saved)
    })
    const handleStageChange = (mode: StageMode) => {
      setStageMode(mode)
    }
    global.app_event.on('changePlayerStageMode' as any, handleStageChange)
    return () => {
      global.app_event.off('changePlayerStageMode' as any, handleStageChange)
    }
  }, [])

  const switchStage = (mode: StageMode) => {
    setStageMode(mode)
    void saveData(STAGE_STORAGE_KEY, mode)
  }

  const cycleStage = () => {
    const modes: StageMode[] = ['vinyl', 'cassette', 'cd', 'vu', 'classic']
    const next = modes[(modes.indexOf(stageMode) + 1) % modes.length]
    switchStage(next)
  }

  useEffect(() => {
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  const style = useMemo(() => {
    const imgWidth = Math.min(winWidth * 0.8, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.5)
    return {
      width: imgWidth,
      height: imgWidth,
      borderRadius: 6,
    }
  }, [statusBarHeight, winHeight, winWidth])

  const renderStage = () => {
    switch (stageMode) {
      case 'vinyl':
        return <VinylStage isPlaying={isPlaying} picUrl={pic} />
      case 'cassette':
        return <CassetteStage isPlaying={isPlaying} title={musicInfo.name} artist={musicInfo.singer} />
      case 'cd':
        return <LaserCdStage isPlaying={isPlaying} picUrl={pic} />
      case 'vu':
        return <VuMeterStage isPlaying={isPlaying} title={musicInfo.name} artist={musicInfo.singer} />
      case 'classic':
      default:
        return (
          <View style={{ ...styles.content, elevation: animated ? 3 : 0 }}>
            <Image url={pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={style} />
          </View>
        )
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} onPress={cycleStage} style={styles.stageTouchable}>
        {renderStage()}
      </TouchableOpacity>
    </View>
  )
}

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 290,
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0)',
    borderRadius: 6,
  },
})
