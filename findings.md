# 技术排查与技术决策笔记 (Findings & Decisions)

## 1. 混音避让缺失根因 (Ducking Missing)
- 源码 `src/plugins/player/service.ts`:
  在 `RemoteDuck` 事件中，当 `!player.isHandleAudioFocus` 时，代码遇到 `paused` 仅粗暴 `play()`，且未监听处理 `ducking` 字段。
  当外部系统请求临时避让降音（如微信语音、高德导航）时，ExoPlayer 保持 100% 音量，发生恶性争抢。
- 方案：
  建立 `isDucked` 与 `originalVolume` 记录，当 `ducking == true` 时，将当前播放音量降为原音量的 25%（`setVolume(originalVolume * 0.25)`）；
  当 `ducking == false` 或系统焦点完全归还时，恢复为 `originalVolume`。

## 2. 幽灵自播根因 (Ghost Auto-Resume)
- 源码 `src/plugins/player/service.ts#L280`:
  在 `TPState.Paused` 兜底中，只检查了 `!global.lx.isPlayedStop` 和 `Date.now() - lastPlayingTime < 3500`。
  用户在 UI 点击暂停属于主动暂停，但此时若手机后台有小红书、微信等音频组件活跃，`isOtherAppPlayingAudio()` 返回 true，被误判为“外部打断导致的暂停”，进而启动打断状态机与原生看门狗。外部音频一旦停掉，原生看门狗立刻派发 `KEYCODE_MEDIA_PLAY` 广播唤醒播放！
- 方案：
  设立全局显式用户暂停标记 `isUserExplicitPaused`。
  在 `pause()`, `stop()`, `RemotePause`, `RemoteStop` 等用户主动操作入口，立即将 `isUserExplicitPaused = true`，并立即调用 `notifyAudioInterruptionState(false)` 和注销所有定时器。
  在 `TPState.Paused` 中，若 `isUserExplicitPaused == true`，绝对禁止激活打断看门狗。
  只有在用户主动点击 `play()`、`RemotePlay`、切换下一曲时，才解除此门禁。
