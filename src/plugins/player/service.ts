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
import { onOtherAppAudioEnded, isOtherAppPlayingAudio, notifyAudioInterruptionState, setUserExplicitPause } from '@/utils/nativeModules/utils'

let isInitialized = false

// ── 🛡️ 音频打断与外部应用发声结束自动续播状态机 (微信语音/短视频/游戏/导航) ──
let isPausedByInterruption = false
let interruptedTime = 0
let lastPlayingTime = 0
let autoResumeTimer: NodeJS.Timeout | null = null
let focusProbingTimer: NodeJS.Timeout | null = null

const stopFocusProbingWatchdog = (reason: string = 'Normal') => {
  if (focusProbingTimer) {
    clearInterval(focusProbingTimer)
    focusProbingTimer = null
    log.info('PlaybackService', `[FocusWatchdog] Watchdog stopped. Reason: ${reason}`)
  }
}

const startFocusProbingWatchdog = (triggerSource: string) => {
  stopFocusProbingWatchdog('Restarting')
  if (global.lx.isUserExplicitPaused) {
    log.info('PlaybackService', `[FocusWatchdog] Not starting watchdog because global.lx.isUserExplicitPaused is true.`)
    return
  }
  let probeCount = 0
  const maxProbes = 40 // 40 次 * 1000ms = 40 秒
  log.info('PlaybackService', `[FocusWatchdog] Watchdog STARTED! Trigger: [${triggerSource}], MaxProbes: ${maxProbes}, Interval: 1000ms`)

  focusProbingTimer = setInterval(async() => {
    probeCount++
    if (global.lx.isUserExplicitPaused) {
      stopFocusProbingWatchdog(`User explicit pause enforced (Probe #${probeCount})`)
      isPausedByInterruption = false
      return
    }
    if (!isPausedByInterruption) {
      stopFocusProbingWatchdog(`Interruption flag cleared (Probe #${probeCount})`)
      return
    }
    if (probeCount > maxProbes) {
      stopFocusProbingWatchdog(`Timeout reached (>40s, count=${probeCount})`)
      isPausedByInterruption = false
      return
    }
    if (!settingState.setting['player.isAutoResumeAfterFocusGain']) {
      stopFocusProbingWatchdog('Auto-resume disabled by user settings')
      return
    }
    try {
      const isOtherPlaying = await isOtherAppPlayingAudio()
      log.info('PlaybackService', `[FocusWatchdog] Heartbeat Probe #${probeCount}/${maxProbes}: isOtherPlaying=${isOtherPlaying}, isPlay=${playerState.isPlay}`)
      if (!isOtherPlaying && isPausedByInterruption && !global.lx.isPlayedStop && !global.lx.isUserExplicitPaused && playerState.playMusicInfo.musicInfo) {
        log.info('PlaybackService', `[FocusWatchdog] External audio stopped (confirmed at Probe #${probeCount})! Auto resuming playback NOW!`)
        stopFocusProbingWatchdog('ResumedSuccessfully')
        isPausedByInterruption = false
        play()
      }
    } catch (e: any) {
      log.warn('PlaybackService', `[FocusWatchdog] Heartbeat Probe #${probeCount} error: ${e?.message}`)
    }
  }, 1000)
}

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
  stopFocusProbingWatchdog()
  isPausedByInterruption = false
  global.lx.isPlayedStop = false
  exitApp(reason)
}


const registerPlaybackService = async() => {
  if (isInitialized) return

  console.log('reg services...')
  TrackPlayer.addEventListener(TPEvent.RemotePlay, () => {
    log.info('PlaybackService', '[RemotePlay] RemotePlay triggered. Unlocking isUserExplicitPaused.')
    global.lx.isUserExplicitPaused = false
    setUserExplicitPause(false)
    isPausedByInterruption = false
    notifyAudioInterruptionState(false)
    stopFocusProbingWatchdog()
    if (autoResumeTimer) clearTimeout(autoResumeTimer)
    play()
  })

  TrackPlayer.addEventListener(TPEvent.RemotePause, () => {
    log.info('PlaybackService', '[RemotePause] RemotePause triggered by user. Enforcing isUserExplicitPaused=true lock.')
    global.lx.isUserExplicitPaused = true
    setUserExplicitPause(true)
    clearBufferingWatchdog()
    stopFocusProbingWatchdog()
    isPausedByInterruption = false
    notifyAudioInterruptionState(false)
    if (autoResumeTimer) clearTimeout(autoResumeTimer)
    void pause()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteNext, () => {
    global.lx.isUserExplicitPaused = false
    setUserExplicitPause(false)
    clearBufferingWatchdog()
    stopFocusProbingWatchdog()
    isPausedByInterruption = false
    if (autoResumeTimer) clearTimeout(autoResumeTimer)
    void playNext()
  })

  TrackPlayer.addEventListener(TPEvent.RemotePrevious, () => {
    global.lx.isUserExplicitPaused = false
    setUserExplicitPause(false)
    clearBufferingWatchdog()
    stopFocusProbingWatchdog()
    isPausedByInterruption = false
    if (autoResumeTimer) clearTimeout(autoResumeTimer)
    void playPrev()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteStop, () => {
    log.info('PlaybackService', '[RemoteStop] RemoteStop triggered. Enforcing isUserExplicitPaused=true lock.')
    global.lx.isUserExplicitPaused = true
    setUserExplicitPause(true)
    clearBufferingWatchdog()
    stopFocusProbingWatchdog()
    isPausedByInterruption = false
    notifyAudioInterruptionState(false)
    if (autoResumeTimer) clearTimeout(autoResumeTimer)
    void handleExitApp('Remote Stop')
  })

  TrackPlayer.addEventListener(TPEvent.PlaybackError, async(err: any) => {
    clearBufferingWatchdog()
    stopFocusProbingWatchdog()
    isPausedByInterruption = false
    if (autoResumeTimer) clearTimeout(autoResumeTimer)
    log.error('PlaybackService', 'playback-error:', err)
    global.app_event.error()
    global.app_event.playerError()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteSeek, async({ position }) => {
    global.app_event.setProgress(position as number)
  })

  // 🛡️【外部应用发声结束原生声学监听引擎 (Android AudioPlaybackCallback)】：
  // 彻底攻克 ColorOS/MIUI 等国产 ROM 媒体发声后将播放器移出 AudioManager 焦点栈导致的“耳聋/不回传”死穴！
  onOtherAppAudioEnded(() => {
    log.info('PlaybackService', `[AudioObserver] Other app audio playback ended notification received from native layer! isUserExplicitPaused=${global.lx.isUserExplicitPaused}, isPausedByInterruption=${isPausedByInterruption}`)
    if (!settingState.setting['player.isAutoResumeAfterFocusGain']) {
      log.info('PlaybackService', '[AudioObserver] Auto-resume is disabled in user settings, skipping.')
      stopFocusProbingWatchdog()
      return
    }
    // 🛡️【物理级硬门禁】：用户主动点击了暂停或停止，绝对严禁续播！
    if (global.lx.isUserExplicitPaused || !isPausedByInterruption) {
      log.info('PlaybackService', '[AudioObserver] User explicitly paused or not in interruption state, strictly BLOCKING auto-resume.')
      stopFocusProbingWatchdog('UserExplicitPauseEnforced')
      return
    }

    const elapsed = Date.now() - interruptedTime
    // 超过 120 秒视作用户已放弃继续收听，不再突兀起播
    if (elapsed > 120000) {
      log.info('PlaybackService', `[AudioObserver] Interruption elapsed ${elapsed}ms > 120s, cancelling auto resume.`)
      isPausedByInterruption = false
      stopFocusProbingWatchdog()
      return
    }

    if (autoResumeTimer) clearTimeout(autoResumeTimer)
    autoResumeTimer = null
    stopFocusProbingWatchdog()

    // 🛡️【0ms 瞬间极速续播】：严禁在切后台/息屏状态下调用 setTimeout！
    // 手机息屏切后台时，JS setTimeout 会被系统深度节流 10 秒甚至挂起，必须 0ms 同步起播！
    if (isPausedByInterruption && !global.lx.isPlayedStop && !global.lx.isUserExplicitPaused && playerState.playMusicInfo.musicInfo) {
      log.info('PlaybackService', '[AudioObserver] External audio released, INSTANTLY auto-resuming playback (0ms delay)!')
      isPausedByInterruption = false
      notifyAudioInterruptionState(false)
      play()
    }
  })

  // 🛡️【音频焦点争抢与混音控制 (RemoteDuck) 状态机】：
  // 1. 当关闭【自动暂停】时（player.isHandleAudioFocus = false）：
  //    用户期望与微信语音、短视频、游戏混音同时发声；
  //    当系统发出 ducking 信号（高德导航、微信语音等），优雅降低音乐至 25% 背景音，避免全音量争抢！
  //    待外部发声结束（ducking=false），优雅恢复至原音量！
  // 2. 当开启【自动暂停】时（player.isHandleAudioFocus = true）：
  //    外部应用发声（微信语音、刷视频、接打电话），记录被打断状态，优雅暂停；
  //    待外部应用播放完毕，由原生声学监听引擎（或系统焦点回调）100% 自动唤醒续播！
  TrackPlayer.addEventListener(TPEvent.RemoteDuck, async({ permanent, paused, ducking }) => {
    const wasPlaying = playerState.isPlay || (Date.now() - lastPlayingTime < 3000)
    log.info('PlaybackService', `[RemoteDuck] Audio focus event: permanent=${permanent}, paused=${paused}, ducking=${ducking}, wasPlaying=${wasPlaying}, currentIsPlay=${playerState.isPlay}, isUserExplicitPaused=${global.lx.isUserExplicitPaused}`)
    
    // 🛡️【物理级硬门禁】：用户已主动暂停，任何系统广播不得唤醒
    if (global.lx.isUserExplicitPaused) {
      log.info('PlaybackService', '[RemoteDuck] Strictly BLOCKED because global.lx.isUserExplicitPaused is true.')
      return
    }

    // ── 🛡️【智能混音避让 (Ducking 25% 优雅降音与复原)】──
    // 无论混音模式还是普通模式，当系统提示 ducking (高德导航播报、微信语音播放、短视频发声)
    if (ducking) {
      if (!global.lx.isDucked) {
        global.lx.preDuckVolume = settingState.setting['player.volume'] ?? 1
        const duckedVolume = Math.max(0.05, Math.round(global.lx.preDuckVolume * 0.25 * 100) / 100)
        log.info('PlaybackService', `[RemoteDuck] Ducking requested! Smoothly lowering volume from ${global.lx.preDuckVolume} -> ${duckedVolume} (25% background mixing)`)
        global.lx.isDucked = true
        await TrackPlayer.setVolume(duckedVolume)
      }
      // 在允许混音模式（!isHandleAudioFocus）下，系统可能会同时送 paused=true，反手恢复播放维持背景低音
      if (!settingState.setting['player.isHandleAudioFocus'] && paused && playerState.isPlay) {
        log.info('PlaybackService', '[RemoteDuck] Mixing mode active: resuming play() at ducked volume!')
        play()
      }
      return
    } else if (global.lx.isDucked && !paused) {
      // ducking 结束且未暂停，恢复原音量
      log.info('PlaybackService', `[RemoteDuck] Ducking ended! Restoring volume back to ${global.lx.preDuckVolume}`)
      global.lx.isDucked = false
      await TrackPlayer.setVolume(global.lx.preDuckVolume)
    }

    // ── 模式 1：允许混音模式（player.isHandleAudioFocus = false）──
    if (!settingState.setting['player.isHandleAudioFocus']) {
      if (paused && playerState.isPlay) {
        log.info('PlaybackService', '[RemoteDuck] Mixing mode active: immediately resuming play() to maintain background mixing!')
        play()
      }
      return
    }

    // ── 模式 2：自动暂停模式（player.isHandleAudioFocus = true）──
    if (paused) {
      clearBufferingWatchdog()
      // 🛡️ 破除 Android ROM 时序死锁：
      // 在 ColorOS/MIUI 上系统往往先触发 PlaybackState.Paused 将 playerState.isPlay 改为 false，随后才抛出 RemoteDuck
      // 因此只要当前处于播放意图，或者过去 3000ms 内刚刚处于 Playing 状态，一律判定为外部发声打断！
      if (wasPlaying && playerState.playMusicInfo.musicInfo && !global.lx.isPlayedStop && !global.lx.isUserExplicitPaused) {
        log.info('PlaybackService', `[RemoteDuck] Pausing due to external audio focus interruption (permanent=${permanent}, wasPlaying=${wasPlaying})`)
        isPausedByInterruption = true
        notifyAudioInterruptionState(true)
        interruptedTime = Date.now()
        global.app_event.playerPause()
        global.app_event.pause()
        if (settingState.setting['player.isAutoResumeAfterFocusGain']) {
          startFocusProbingWatchdog('RemoteDuck(paused=true)')
        }
      }
      return
    }

    // 系统焦点主动归还（!paused）
    if (!paused && isPausedByInterruption && !global.lx.isUserExplicitPaused) {
      log.info('PlaybackService', '[RemoteDuck] Focus regained from system callback (!paused). Auto resuming playback!')
      isPausedByInterruption = false
      notifyAudioInterruptionState(false)
      stopFocusProbingWatchdog('RemoteDuck(FocusRegained)')
      if (autoResumeTimer) clearTimeout(autoResumeTimer)
      if (settingState.setting['player.isAutoResumeAfterFocusGain']) {
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
        clearBufferingWatchdog()
        break
      case TPState.Paused:
        clearBufferingWatchdog()
        global.app_event.playerPause()
        global.app_event.pause()
        // 🛡️【物理级防幽灵自播硬门禁】：
        // 若是用户主动暂停（或处于显式暂停门禁锁状态），绝对严禁将其判定为外部打断！
        if (global.lx.isUserExplicitPaused) {
          log.info('PlaybackService', '[PlaybackState.Paused] User explicitly paused playback. Interruption watchdog is strictly BLOCKED.')
          isPausedByInterruption = false
          notifyAudioInterruptionState(false)
          stopFocusProbingWatchdog('UserExplicitPauseEnforced')
          break
        }
        // 🛡️ 智能打断探活兜底：
        // 某些国产系统在外部应用打断时直接暂停了播放器，可能延迟或不分发 RemoteDuck 事件
        // 如果当前并非用户手动按下了停止，且过去 3500ms 内处于 Playing 状态，且检测到外部应用正在播放，自动激活打断看门狗！
        if (Date.now() - lastPlayingTime < 3500 && !isPausedByInterruption && !global.lx.isPlayedStop && playerState.playMusicInfo.musicInfo) {
          void isOtherAppPlayingAudio().then(isOther => {
            if (isOther && !isPausedByInterruption && !global.lx.isPlayedStop && !global.lx.isUserExplicitPaused && playerState.playMusicInfo.musicInfo) {
              log.info('PlaybackService', '[PlaybackState.Paused] Concurrent external audio playback detected! Auto-activating watchdog...')
              isPausedByInterruption = true
              notifyAudioInterruptionState(true)
              interruptedTime = Date.now()
              if (settingState.setting['player.isAutoResumeAfterFocusGain']) {
                startFocusProbingWatchdog('PlaybackState.Paused(ConcurrentExternalAudio)')
              }
            }
          })
        }
        break
      case TPState.Playing:
        lastPlayingTime = Date.now()
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
    // 🛡️ 严格门禁：冷启动、主动停止、无播放意图（playerState.isPlay 为 false）或空队列时，严禁切歌自播！
    if (global.lx.isPlayedStop || !playerState.isPlay || isEmpty()) return
    // 队列走尽且当前仍处于播放意图状态时，自愈驱动切换至下一曲
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
