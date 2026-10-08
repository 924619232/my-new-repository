/* eslint-disable @typescript-eslint/no-misused-promises */
import TrackPlayer, { State as TPState, Event as TPEvent } from 'react-native-track-player'
// import { store } from '@/store'
// import { action as playerAction, STATUS } from '@/store/modules/player'
import { isTempId, isEmpty } from './utils'
// import { play as lrcPlay, pause as lrcPause } from '@/core/lyric'
import { exitApp } from '@/core/common'
import { getCurrentTrackId } from './playList'
import { pause, play, playNext, playPrev, setMusicUrl } from '@/core/player/player'
import playerState from '@/store/player/state'
import { log } from '@/utils/log'

let isInitialized = false

// ── 缓冲挂死看门狗与自动自愈机制 (针对车机源防盗链 410 / State 6 缓冲卡死) ──
let bufferingWatchdogTimer: NodeJS.Timeout | null = null
let bufferingRetryCount = 0
let lastBufferingSongId: string | null = null

const clearBufferingWatchdog = () => {
  if (bufferingWatchdogTimer) {
    clearTimeout(bufferingWatchdogTimer)
    bufferingWatchdogTimer = null
  }
}

const startBufferingWatchdog = () => {
  clearBufferingWatchdog()
  bufferingWatchdogTimer = setTimeout(async() => {
    bufferingWatchdogTimer = null
    const currentMusic = playerState.playMusicInfo.musicInfo
    if (!currentMusic) return

    log.warn('PlaybackService', `[Buffering Watchdog] State 6 Buffering timeout (>3.5s) on [${currentMusic.name}]! Dead link/410 suspected.`)
    
    if (lastBufferingSongId !== currentMusic.id) {
      lastBufferingSongId = currentMusic.id
      bufferingRetryCount = 0
    }

    if (bufferingRetryCount < 1) {
      bufferingRetryCount++
      log.info('PlaybackService', `[SelfHealing] Forcing fresh URL fetch for [${currentMusic.name}] (retry=${bufferingRetryCount})...`)
      setMusicUrl(currentMusic, true)
    } else {
      log.warn('PlaybackService', `[SelfHealing] Fresh URL also stuck in buffering for [${currentMusic.name}], skipping to next song.`)
      bufferingRetryCount = 0
      void playNext(true)
    }
  }, 3500)
}

// 销毁播放器并退出
const handleExitApp = async(reason: string) => {
  clearBufferingWatchdog()
  global.lx.isPlayedStop = false
  exitApp(reason)
}


const registerPlaybackService = async() => {
  if (isInitialized) return

  console.log('reg services...')
  TrackPlayer.addEventListener(TPEvent.RemotePlay, () => {
    play()
  })

  TrackPlayer.addEventListener(TPEvent.RemotePause, () => {
    clearBufferingWatchdog()
    void pause()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteNext, () => {
    clearBufferingWatchdog()
    void playNext()
  })

  TrackPlayer.addEventListener(TPEvent.RemotePrevious, () => {
    clearBufferingWatchdog()
    void playPrev()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteStop, () => {
    clearBufferingWatchdog()
    void handleExitApp('Remote Stop')
  })

  TrackPlayer.addEventListener(TPEvent.PlaybackError, async(err: any) => {
    clearBufferingWatchdog()
    log.error('PlaybackService', 'playback-error:', err)
    global.app_event.error()
    global.app_event.playerError()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteSeek, async({ position }) => {
    global.app_event.setProgress(position as number)
  })

  // 🛡️【音频焦点与压低音量 (Ducking) 规范】：
  // 1. 当 handleAudioFocus 为 true 时，ExoPlayer 底层已全权自主处理音频混音与硬件焦点。
  // 2. 遇临时提示音/导航发声时，ExoPlayer 自动降低音量（Duck），不应粗暴调用 pause() 中断音乐播放。
  // 3. 严禁在 RemoteDuck 回调内反向调用 pause()，彻底切断底层与 JS Bridge 之间每秒数百次的死循环状态轰炸（杜绝 2.5 万次死锁卡死）。
  // 4. 仅作客观事件监控与状态机同步；当遭遇永久性丢失且底层已暂停时，同步上层 UI 状态。
  TrackPlayer.addEventListener(TPEvent.RemoteDuck, async({ permanent, paused, ducking }) => {
    log.info('PlaybackService', `[RemoteDuck] Audio focus event: permanent=${permanent}, paused=${paused}, ducking=${ducking}`)
    if (permanent && paused) {
      // 永久丧失焦点（如电话接通、被其他独占播放器接管），底层 ExoPlayer 已经将 playWhenReady 设为 false，清空看门狗并同步状态
      clearBufferingWatchdog()
      global.app_event.playerPause()
      global.app_event.pause()
    }
  })

  TrackPlayer.addEventListener(TPEvent.PlaybackState, async info => {
    if (global.lx.gettingUrlId || isTempId()) return

    switch (info.state) {
      case TPState.None:
        clearBufferingWatchdog()
        break
      case TPState.Ready:
      case TPState.Stopped:
      case TPState.Paused:
        clearBufferingWatchdog()
        global.app_event.playerPause()
        global.app_event.pause()
        break
      case TPState.Playing:
        clearBufferingWatchdog()
        bufferingRetryCount = 0
        global.app_event.playerPlaying()
        global.app_event.play()
        break
      case TPState.Buffering:
        startBufferingWatchdog()
        global.app_event.pause()
        global.app_event.playerWaiting()
        break
      case TPState.Connecting:
        global.app_event.playerLoadstart()
        break
      default:
        break
    }
    if (global.lx.isPlayedStop) return handleExitApp('Timeout Exit')
  })
  TrackPlayer.addEventListener(TPEvent.PlaybackTrackChanged, async info => {
    clearBufferingWatchdog()
    bufferingRetryCount = 0
    // console.log('PlaybackTrackChanged====>', info)
    global.lx.playerTrackId = await getCurrentTrackId()
    log.info('PlaybackService', `PlaybackTrackChanged trackId: ${global.lx.playerTrackId}, info: ${JSON.stringify(info)}`)
    if (info.track == null) return
    if (global.lx.isPlayedStop) return handleExitApp('Timeout Exit')

    if (isEmpty()) {
      log.warn('PlaybackService', 'PlaybackTrackChanged isEmpty matched, pausing')
      await TrackPlayer.pause()
      global.app_event.playerPause()
      global.app_event.pause()
      global.app_event.playerEnded()
      global.app_event.playerEmptied()
      // if (retryTrack) {
      //   if (retryTrack.musicId == retryGetUrlId) {
      //     if (++retryGetUrlNum > 1) {
      //       store.dispatch(playerAction.playNext(true))
      //       retryGetUrlId = null
      //       retryTrack = null
      //       return
      //     }
      //   } else {
      //     retryGetUrlId = retryTrack.musicId
      //     retryGetUrlNum = 0
      //   }
      //   store.dispatch(playerAction.refreshMusicUrl(global.lx.playInfo.currentPlayMusicInfo, errorTime))
      // } else {
      //   store.dispatch(playerAction.playNext(true))
      // }
    }
  //   // if (!info.nextTrack) return
  //   // if (info.track) {
  //   //   const track = info.track.substring(0, info.track.lastIndexOf('__//'))
  //   //   const nextTrack = info.track.substring(0, info.nextTrack.lastIndexOf('__//'))
  //   //   console.log(nextTrack, track)
  //   //   if (nextTrack == track) return
  //   // }
  //   // const track = await TrackPlayer.getTrack(info.nextTrack)
  //   // if (!track) return
  //   // let newTrack
  //   // if (track.url == defaultUrl) {
  //   //   TrackPlayer.pause().then(async() => {
  //   //     isRefreshUrl = true
  //   //     retryGetUrlId = track.id
  //   //     retryGetUrlNum = 0
  //   //     try {
  //   //       newTrack = await updateTrackUrl(track)
  //   //       console.log('++++newTrack++++', newTrack)
  //   //     } catch (error) {
  //   //       console.log('error', error)
  //   //       if (error.message != '跳过播放') TrackPlayer.skipToNext()
  //   //       isRefreshUrl = false
  //   //       retryGetUrlId = null
  //   //       return
  //   //     }
  //   //     retryGetUrlId = null
  //   //     isRefreshUrl = false
  //   //     console.log(await TrackPlayer.getQueue(), null, 2)
  //   //     await TrackPlayer.play()
  //   //   })
  //   // }
  //   // store.dispatch(playerAction.playNext())
  })
  // TrackPlayer.addEventListener('playback-queue-ended', async info => {
  //   // console.log('playback-queue-ended', info)
  //   store.dispatch(playerAction.playNext())
  //   // if (!info.nextTrack) return
  //   // const track = await TrackPlayer.getTrack(info.nextTrack)
  //   // if (!track) return
  //   // // if (track.url == defaultUrl) {
  //   // //   TrackPlayer.pause()
  //   // //   getMusicUrl(track.original).then(url => {
  //   // //     TrackPlayer.updateMetadataForTrack(info.nextTrack, {
  //   // //       url,
  //   // //     })
  //   // //     TrackPlayer.play()
  //   // //   })
  //   // // }
  //   // if (!track.artwork) {
  //   //   getMusicPic(track.original).then(url => {
  //   //     console.log(url)
  //   //     TrackPlayer.updateMetadataForTrack(info.nextTrack, {
  //   //       artwork: url,
  //   //     })
  //   //   })
  //   // }
  // })
  // TrackPlayer.addEventListener('playback-destroy', async() => {
  //   console.log('playback-destroy')
  //   store.dispatch(playerAction.destroy())
  // })
  isInitialized = true
}


export default () => {
  if (global.lx.playerStatus.isRegisteredService) return
  console.log('handle registerPlaybackService...')
  TrackPlayer.registerPlaybackService(() => registerPlaybackService)
  global.lx.playerStatus.isRegisteredService = true
}
