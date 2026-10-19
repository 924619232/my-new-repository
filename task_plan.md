# 任务实施计划 (Task Plan) - 播放状态机即时响应与 UI/声音 100% 同步

## 目标
1. 解决用户点击“暂停”后 UI 依然显示“继续播放”的事件死锁问题，改用乐观即时响应与强制状态对齐。
2. 解决混音打断时声音已停但状态栏与播放页依然假装在播放的虚假状态问题。
3. 版本号自增至 v1.9.54-log (Code 131)，推送到 GitHub CI 编译并直推真机验证。

## 执行步骤
- [ ] 阶段 1：在 `src/core/player/player.ts` 的 `pause()` / `stop()` 中实现 0ms 立即驱动 `setIsPlay(false)` 与 `global.app_event.pause()`
- [ ] 阶段 2：在 `src/plugins/player/service.ts` 中重构混音与暂停状态上报，杜绝声音停止但 UI 假装播放的虚标问题
- [ ] 阶段 3：在 `UtilsModule.java` 中确保用户暂停时立即撤销通知栏 Ongoing 强锁
- [ ] 阶段 4：自增版本号至 1.9.54-log (Code 131)，推送 CI 编译
- [ ] 阶段 5：通过 ADB 推送到真机并实测验证
