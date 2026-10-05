import TrackPlayer, { Event } from 'react-native-track-player'
import { updateOptions, setVolume, setPlaybackRate, migratePlayerCache } from './utils'
import dspEngine from '@/services/audio/dspEngine'
import { log } from '@/utils/log'

const listenEvent = () => {
  TrackPlayer.addEventListener(Event.PlaybackError, (err: any) => {
    log.error('TrackPlayer', 'Playback error encountered:', err)
  })
  TrackPlayer.addEventListener(Event.PlaybackState, (state: any) => {
    log.info('TrackPlayer', 'Playback state changed:', state?.state ?? state)
  })
  TrackPlayer.addEventListener(Event.PlaybackTrackChanged, (info: any) => {
    log.info('TrackPlayer', 'Playback track changed:', info?.nextTrack ?? info)
  })
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, (info: any) => {
    log.info('TrackPlayer', 'Playback queue ended:', info)
  })
}

const initial = async({ volume, playRate, cacheSize, isHandleAudioFocus, isEnableAudioOffload }: {
  volume: number
  playRate: number
  cacheSize: number
  isHandleAudioFocus: boolean
  isEnableAudioOffload: boolean
}) => {
  if (global.lx.playerStatus.isIniting || global.lx.playerStatus.isInitialized) return
  global.lx.playerStatus.isIniting = true
  log.info('TrackPlayer', 'Initializing player with cache size:', cacheSize * 1024)
  await migratePlayerCache()
  await TrackPlayer.setupPlayer({
    maxCacheSize: cacheSize * 1024,
    maxBuffer: 1000,
    waitForBuffer: true,
    handleAudioFocus: isHandleAudioFocus,
    audioOffload: false, // 🛡️【物理级防外放熔断】：无论上层配置如何，强行锁死为 false，杜绝 DSP 独占被撕毁导致的扬声器逃逸
    autoUpdateMetadata: false,
  })
  global.lx.playerStatus.isInitialized = true
  global.lx.playerStatus.isIniting = false
  await updateOptions()
  await setVolume(volume)
  await setPlaybackRate(playRate)
  void dspEngine.init().catch(() => {})
  listenEvent()
}


const isInitialized = () => global.lx.playerStatus.isInitialized


export {
  initial,
  isInitialized,
  setVolume,
  setPlaybackRate,
}

export {
  setResource,
  setPause,
  setPlay,
  setCurrentTime,
  getDuration,
  setStop,
  resetPlay,
  getPosition,
  updateMetaData,
  onStateChange,
  isEmpty,
  useBufferProgress,
  initTrackInfo,
} from './utils'
