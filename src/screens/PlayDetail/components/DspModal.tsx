import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import {
  ScrollView,
  View,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native'
import Popup, { type PopupType, type PopupProps } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import Slider from '@/components/common/Slider'
import { useTheme } from '@/store/theme/hook'
import dspEngine, { useDspState, type DspPreset } from '@/services/audio/dspEngine'

export interface DspModalProps extends Omit<PopupProps, 'children'> {}

export interface DspModalType {
  show: () => void
}

const PRESETS: Array<{ key: DspPreset; label: string; icon: string }> = [
  { key: 'vinyl', label: '黑胶温暖', icon: '💿' },
  { key: 'bass', label: '澎湃重低音', icon: '💥' },
  { key: 'vocal', label: '人声毒药', icon: '🎤' },
  { key: 'spatial', label: '全景声场', icon: '🌌' },
  { key: 'treble', label: '通透高频', icon: '💎' },
  { key: 'flat', label: '原声直通', icon: '🎯' },
]

function formatFreq(hz: number): string {
  if (hz >= 1000) {
    const k = hz / 1000
    return k % 1 === 0 ? `${k}kHz` : `${k.toFixed(1)}kHz`
  }
  return `${hz}Hz`
}

export default forwardRef<DspModalType, DspModalProps>((props, ref) => {
  const [visible, setVisible] = useState(false)
  const popupRef = useRef<PopupType>(null)
  const theme = useTheme()
  const dsp = useDspState()

  useImperativeHandle(ref, () => ({
    show() {
      if (visible) popupRef.current?.setVisible(true)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          popupRef.current?.setVisible(true)
        })
      }
    },
  }))

  if (!visible) return null

  const handleToggle = (enabled: boolean) => {
    void dspEngine.setEnabled(enabled)
  }

  const handleSelectPreset = (preset: DspPreset) => {
    void dspEngine.setPreset(preset)
  }

  const handleBandChange = (band: number, value: number) => {
    void dspEngine.setBandLevel(band, Math.round(value))
  }

  const handleBassBoostChange = (value: number) => {
    void dspEngine.setBassBoost(Math.round(value))
  }

  const handleVirtualizerChange = (value: number) => {
    void dspEngine.setVirtualizer(Math.round(value))
  }

  return (
    <Popup ref={popupRef} title="10段原生硬件DSP调音台" {...props}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View onStartShouldSetResponder={() => true} style={styles.content}>
          {/* Master Switch & Engine Status */}
          <View style={[styles.headerCard, { borderColor: theme['c-border-background'] }]}>
            <View style={styles.headerLeft}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle} size={15}>原生硬件DSP增强引擎</Text>
                <View style={[styles.statusBadge, { backgroundColor: dsp.enabled ? '#10b98122' : '#64748b22' }]}>
                  <Text size={11} color={dsp.enabled ? '#10b981' : '#64748b'}>
                    {dsp.enabled ? '● 硬件加速已启动' : '○ 已旁路关闭'}
                  </Text>
                </View>
              </View>
              <Text size={11} color={theme['c-font-label']}>
                直接调用底层 AudioFx 硬件加速驱动 · 0毫秒相位补偿
              </Text>
            </View>
            <Switch
              value={dsp.enabled}
              onValueChange={handleToggle}
              thumbColor={dsp.enabled ? '#10b981' : '#94a3b8'}
              trackColor={{ false: '#334155', true: '#059669' }}
            />
          </View>

          {/* Preset Buttons */}
          <View style={styles.section}>
            <Text size={13} style={styles.sectionTitle}>声场音效大师预设</Text>
            <View style={styles.presetsGrid}>
              {PRESETS.map(p => {
                const isActive = dsp.preset === p.key
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[
                      styles.presetBtn,
                      {
                        backgroundColor: isActive ? '#10b98125' : '#1e293b40',
                        borderColor: isActive ? '#10b981' : '#334155',
                      },
                    ]}
                    onPress={() => handleSelectPreset(p.key)}
                    activeOpacity={0.7}
                  >
                    <Text size={14}>{p.icon}</Text>
                    <Text
                      size={12}
                      style={{
                        fontWeight: isActive ? 'bold' : 'normal',
                        color: isActive ? '#10b981' : theme['c-font'],
                        marginLeft: 4,
                      }}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Bass & 3D Spatial Knobs */}
          <View style={styles.section}>
            <Text size={13} style={styles.sectionTitle}>声学动态强化推子</Text>
            <View style={styles.fxCard}>
              <View style={styles.fxRow}>
                <View style={styles.fxLabelCol}>
                  <Text size={13} style={styles.fxName}>💥 低音超重炮 (Bass Boost)</Text>
                  <Text size={11} color={theme['c-font-label']}>强化超低频下潜与共鸣</Text>
                </View>
                <Text size={13} style={styles.fxValue} color="#10b981">
                  {Math.round(dsp.bassBoost / 10)}%
                </Text>
              </View>
              <Slider
                value={dsp.bassBoost}
                minimumValue={0}
                maximumValue={1000}
                step={10}
                onValueChange={handleBassBoostChange}
              />

              <View style={[styles.fxRow, { marginTop: 12 }]}>
                <View style={styles.fxLabelCol}>
                  <Text size={13} style={styles.fxName}>🌐 3D 空间环绕 (Virtualizer)</Text>
                  <Text size={11} color={theme['c-font-label']}>虚拟全景宽广声场与环绕感</Text>
                </View>
                <Text size={13} style={styles.fxValue} color="#10b981">
                  {Math.round(dsp.virtualizer / 10)}%
                </Text>
              </View>
              <Slider
                value={dsp.virtualizer}
                minimumValue={0}
                maximumValue={1000}
                step={10}
                onValueChange={handleVirtualizerChange}
              />
            </View>
          </View>

          {/* 10-Band Equalizer */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text size={13} style={styles.sectionTitle}>10频段硬件均衡调音台</Text>
              <TouchableOpacity
                onPress={() => handleSelectPreset('flat')}
                style={styles.resetBtn}
              >
                <Text size={11} color="#10b981">↺ 重置直通</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bandsList}>
              {dsp.bands.map(b => {
                const db = (b.level / 100).toFixed(1)
                const dbStr = b.level > 0 ? `+${db} dB` : `${db} dB`
                return (
                  <View key={b.band} style={styles.bandRow}>
                    <View style={styles.bandLabelBox}>
                      <Text size={12} style={styles.bandFreqText}>
                        {formatFreq(b.centerFreq)}
                      </Text>
                      <Text size={11} color={b.level !== 0 ? '#10b981' : theme['c-font-label']}>
                        {dbStr}
                      </Text>
                    </View>
                    <View style={styles.bandSliderBox}>
                      <Slider
                        value={b.level}
                        minimumValue={dsp.minLevel}
                        maximumValue={dsp.maxLevel}
                        step={50}
                        onValueChange={v => handleBandChange(b.band, v)}
                      />
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </Popup>
  )
})

const styles = StyleSheet.create({
  container: {
    maxHeight: 520,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#0f172a50',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#10b98115',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  fxCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a30',
  },
  fxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fxLabelCol: {
    flex: 1,
  },
  fxName: {
    fontWeight: '600',
  },
  fxValue: {
    fontWeight: 'bold',
  },
  bandsList: {
    gap: 2,
  },
  bandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  bandLabelBox: {
    width: 90,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8,
  },
  bandFreqText: {
    fontWeight: '600',
  },
  bandSliderBox: {
    flex: 1,
  },
})
