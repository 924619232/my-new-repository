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
import settingState from '@/store/setting/state'
import { log } from '@/utils/log'

let isInitialized = false

// ── 🛡️ 音频焦点临时抢占与自动续播状态机 (微信语音/短视频/导航结束平滑续播) ──
let isPausedByTransientLoss = false

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
  isPausedByTransientLoss = false
  global.lx.isPlayedStop = false
  exitApp(reason)
}


const registerPlaybackService = async() => {
  if (isInitialized) return

  console.log('reg services...')
  TrackPlayer.addEventListener(TPEvent.RemotePlay, () => {
    isPausedByTransientLoss = false
    play()
  })

  TrackPlayer.addEventListener(TPEvent.RemotePause, () => {
    clearBufferingWatchdog()
    isPausedByTransientLoss = false
    void pause()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteNext, () => {
    clearBufferingWatchdog()
    isPausedByTransientLoss = false
    void playNext()
  })

  TrackPlayer.addEventListener(TPEvent.RemotePrevious, () => {
    clearBufferingWatchdog()
    isPausedByTransientLoss = false
    void playPrev()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteStop, () => {
    clearBufferingWatchdog()
    isPausedByTransientLoss = false
    void handleExitApp('Remote Stop')
  })

  TrackPlayer.addEventListener(TPEvent.PlaybackError, async(err: any) => {
    clearBufferingWatchdog()
    isPausedByTransientLoss = false
    log.error('PlaybackService', 'playback-error:', err)
    global.app_event.error()
    global.app_event.playerError()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteSeek, async({ position }) => {
    global.app_event.setProgress(position as number)
  })

  // 🛡️【音频焦点与压低音量 (Ducking / Transient Loss) 工业级状态机】：
  // 1. 当 handleAudioFocus 为 false（与其他应用同时播放）时，底层直接混音，无需焦点抢占；
  // 2. 当遭遇临时性失焦（!permanent && (paused || ducking)）：如微信语音、刷短视频、导航提示音发声：
  //    - 若当前正在播放，底层暂停，记录 isPausedByTransientLoss = true；
  // 3. 当第三方发声完毕释放焦点（!paused && !ducking）：
  //    - 若开启了【自动恢复播放】且因临时失焦而暂停，100% 自动平滑恢复播放（无需手动解锁点击）；
  // 4. 当遭遇永久性失焦（permanent && paused）：如接打电话、进入独占全屏游戏，优雅暂停且不自动打扰用户。
  TrackPlayer.addEventListener(TPEvent.RemoteDuck, async({ permanent, paused, ducking }) => {
    log.info('PlaybackService', `[RemoteDuck] Audio focus event: permanent=${permanent}, paused=${paused}, ducking=${ducking}`)
    
    // 若用户关闭了焦点处理（允许混音），则不进行任何暂停/打断干涉
    if (!settingState.setting['player.isHandleAudioFocus']) {
      return
    }

    if (permanent && paused) {
      // 永久丧失焦点：电话接通或用户显式切换至独占媒体，暂停并不再自动续播
      clearBufferingWatchdog()
      isPausedByTransientLoss = false
      global.app_event.playerPause()
      global.app_event.pause()
      return
    }

    if (!permanent && paused) {
      // 临时失去焦点：微信语音、刷短视频等发声，标记状态机
      clearBufferingWatchdog()
      if (playerState.isPlay) {
        log.info('PlaybackService', '[RemoteDuck] Pausing due to transient audio focus loss (WeChat/Video etc.)')
        isPausedByTransientLoss = true
        global.app_event.playerPause()
        global.app_event.pause()
      }
      return
    }

    if (!paused && isPausedByTransientLoss) {
      // 第三方媒体发声结束，系统归还焦点：检查是否开启了自动续播
      isPausedByTransientLoss = false
      if (settingState.setting['player.isAutoResumeAfterFocusGain']) {
        log.info('PlaybackService', '[RemoteDuck] Focus gained after transient loss, auto resuming playback!')
        play()
      }
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

      // 🛡️【后台切歌自愈引擎 (防休眠死锁看门狗)】：
      // 当处于后台且下一曲直链未及时注入时，原生处于暂停。
      // 若 1200ms 内 JS 线程仍未向播放器下发真实直链，直接在 Service 层强制唤醒 playNext(true) 推进切歌！
      setTimeout(() => {
        if (isEmpty() && !global.lx.isPlayedStop && playerState.isPlay) {
          log.warn('PlaybackService', '[SelfHealing] isEmpty persisted >1.2s in background! Forcing playNext(true)...')
          void playNext(true)
        }
      }, 1200)
    }
  })

  // 🛡️【队列走尽兜底自愈 (PlaybackQueueEnded)】：
  // 彻底消灭后台最后一首歌或单曲切歌时队列判定为结束而坠入 State: 0 彻底停死的 Bug
  TrackPlayer.addEventListener(TPEvent.PlaybackQueueEnded, async info => {
    log.info('PlaybackService', `PlaybackQueueEnded event received: ${JSON.stringify(info)}`)
    if (global.lx.isPlayedStop) return
    // 队列走尽且当前仍处于播放意图状态时，立即自愈驱动切换至下一曲
    log.info('PlaybackService', '[SelfHealing] Queue ended in background, driving playNext(true) to keep music streaming...')
    void playNext(true)
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
