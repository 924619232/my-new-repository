import { memo, useRef, useState, useEffect } from 'react'
import { View } from 'react-native'
import { getLogs, clearLogs, getLogFilePath } from '@/utils/log'
import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import { createStyle, toast, clipboardWriteText } from '@/utils/tools'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import CheckBoxItem from '../../components/CheckBoxItem'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const alertRef = useRef<ConfirmAlertType>(null)
  const [logText, setLogText] = useState('')
  const isUnmountedRef = useRef(true)
  const [isEnableSyncErrorLog, setIsEnableSyncErrorLog] = useState(global.lx.isEnableSyncLog)
  const [isEnableUserApiLog, setIsEnableUserApiLog] = useState(global.lx.isEnableUserApiLog)

  const getErrorLog = () => {
    void getLogs().then(log => {
      if (isUnmountedRef.current) return
      setLogText(log.trim())
    })
  }

  const openLogModal = () => {
    getErrorLog()
    alertRef.current?.setVisible(true)
  }

  const handleCopyLog = () => {
    void getLogs().then(log => {
      const trimmed = log.trim()
      if (!trimmed) {
        toast(t('setting_other_log_tip_null'))
        return
      }
      clipboardWriteText(trimmed)
      toast(`已复制全部日志 (${trimmed.length} 字符)`)
    })
  }

  const handleCleanLog = () => {
    void clearLogs().then(() => {
      toast(t('setting_other_log_tip_clean_success'))
      setLogText('')
    })
  }

  const handleSetEnableSyncErrorLog = (enable: boolean) => {
    setIsEnableSyncErrorLog(enable)
    global.lx.isEnableSyncLog = enable
  }

  const handleSetEnableUserApiLog = (enable: boolean) => {
    setIsEnableUserApiLog(enable)
    global.lx.isEnableUserApiLog = enable
  }

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  return (
    <>
      <SubTitle title="运行与测试诊断日志（本地无上报）">
        <View style={styles.checkBox}>
          <CheckBoxItem check={isEnableSyncErrorLog} label={t('setting_other_log_sync_log')} onChange={handleSetEnableSyncErrorLog} />
          <CheckBoxItem check={isEnableUserApiLog} label={t('setting_other_log_user_api_log')} onChange={handleSetEnableUserApiLog} />
        </View>
        <Text size={12} color={theme['c-font-label']} style={styles.pathTip}>
          日志路径: {getLogFilePath()}
        </Text>
        <View style={styles.btnRow}>
          <Button onPress={openLogModal}>{t('setting_other_log_btn_show')}</Button>
          <Button onPress={handleCopyLog}>一键复制</Button>
          <Button onPress={handleCleanLog}>清空日志</Button>
        </View>
      </SubTitle>
      <ConfirmAlert
        ref={alertRef}
        cancelText={t('setting_other_log_btn_hide')}
        confirmText={t('setting_other_log_btn_clean')}
        onConfirm={handleCleanLog}
        showConfirm={!!logText}
        reverseBtn={true}
      >
        <View onStartShouldSetResponder={() => true}>
          {logText ? (
            <View>
              <View style={styles.modalActions}>
                <Button onPress={handleCopyLog}>复制日志</Button>
                <Button onPress={getErrorLog}>刷新</Button>
              </View>
              <Text selectable size={12} style={styles.logContent}>{logText}</Text>
            </View>
          ) : (
            <Text size={13}>{t('setting_other_log_tip_null')}</Text>
          )}
        </View>
      </ConfirmAlert>
    </>
  )
})

const styles = createStyle({
  checkBox: {
    paddingBottom: 10,
    marginLeft: -25,
  },
  pathTip: {
    paddingBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modalActions: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  logContent: {
    lineHeight: 18,
  },
})

