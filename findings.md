# 技术排查与技术决策笔记 (Findings & Decisions)

## 1. 播放/暂停 UI 假死根因
- 源码 `src/core/player/player.ts`:
  `pause()` 仅调用了 `TrackPlayer.pause()`，被动等待 ExoPlayer 触发 `PlaybackState.Paused` -> `setIsPlay(false)`。
  当底层 ExoPlayer 已经因音频焦点被系统置为 Paused 状态时，再次调用 `TrackPlayer.pause()` 不会触发底层状态迁移事件，导致 `setIsPlay(false)` 永远不执行，UI 死锁在 `isPlay = true`。
- 方案：
  在 `pause()` 中立即显式调用 `setIsPlay(false)` 并派发 `global.app_event.pause()`，不再被动等待。
  点击 `play()` 时同理。

## 2. 混音打断时“声音已停但 UI 依然在播放”根因
- 源码 `src/plugins/player/service.ts`:
  在混音模式（`!isHandleAudioFocus`）下，系统发送 `paused` 时，代码直接 `return` 且没有根据实际播放状态同步 UI，导致如果底层被系统强行打断暂停，前端依然显示播放中。
- 方案：
  真实对齐状态，若调用 `play()` 时捕获错误或底层未起播，必须及时回滚 `setIsPlay(false)`。
