# 任务实施计划 (Task Plan) - 混音避让(Ducking)与幽灵自播彻底根治

## 目标
1. 修复混音模式（包括系统 Ducking 打断）下没有主动压低音量（与微信语音/短视频争抢甚至盖过其他音源）的问题，引入业界标准的 25% 优雅降音避让与平滑恢复机制。
2. 彻底根除用户主动暂停/停止后，系统错误自动起播（幽灵续播）的恶性 Bug。
3. 版本号自增至 v1.9.53-log (Code 130001)，推送 CI 编译并直推真机验证。

## 执行步骤
- [x] 阶段 1：在 `src/core/player/player.ts` 与 `src/plugins/player/service.ts` 中建立 `isUserExplicitPaused` 物理级显式暂停门禁锁
- [x] 阶段 2：在 `src/plugins/player/service.ts` 中重构 `RemoteDuck` 状态机，实现优雅 25% 降音避让 (Ducking) 与恢复
- [x] 阶段 3：在 `UtilsModule.java` 中加固：当处于用户显式暂停时，严禁原生看门狗唤醒与按键广播
- [ ] 阶段 4：自增版本号，提交推送 main 分支触发构建
- [ ] 阶段 5：通过 ADB 推送安装至真机并做真机验证
