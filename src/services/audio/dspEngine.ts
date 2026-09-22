import { NativeModules } from 'react-native'
import TrackPlayer from 'react-native-track-player'
import { useEffect, useState } from 'react'
import { getData, saveData } from '@/plugins/storage'

const { DspModule } = NativeModules

export type DspPreset = 'vinyl' | 'bass' | 'vocal' | 'spatial' | 'treble' | 'flat' | 'custom'

export interface BandInfo {
  band: number
  centerFreq: number
  level: number
}

export interface DspState {
  enabled: boolean
  preset: DspPreset
  numBands: number
  minLevel: number
  maxLevel: number
  bands: BandInfo[]
  bassBoost: number
  virtualizer: number
}

const STORAGE_KEY = '@dsp_settings'

const DEFAULT_BANDS: BandInfo[] = [
  { band: 0, centerFreq: 31, level: 0 },
  { band: 1, centerFreq: 62, level: 0 },
  { band: 2, centerFreq: 125, level: 0 },
  { band: 3, centerFreq: 250, level: 0 },
  { band: 4, centerFreq: 500, level: 0 },
  { band: 5, centerFreq: 1000, level: 0 },
  { band: 6, centerFreq: 2000, level: 0 },
  { band: 7, centerFreq: 4000, level: 0 },
  { band: 8, centerFreq: 8000, level: 0 },
  { band: 9, centerFreq: 16000, level: 0 },
]

class DspEngine {
  private inited = false
  private listeners = new Set<(state: DspState) => void>()

  state: DspState = {
    enabled: true,
    preset: 'vinyl',
    numBands: 10,
    minLevel: -1000,
    maxLevel: 1000,
    bands: DEFAULT_BANDS.map(b => ({ ...b })),
    bassBoost: 250,
    virtualizer: 150,
  }

  constructor() {
    void this.loadPersistedState()
  }

  private async loadPersistedState() {
    try {
      const saved = await getData<Partial<DspState>>(STORAGE_KEY)
      if (saved) {
        this.state = {
          ...this.state,
          ...saved,
          bands: saved.bands && saved.bands.length > 0 ? saved.bands : this.state.bands,
        }
        this.notify()
      }
    } catch (e) {}
  }

  private async persistState() {
    try {
      await saveData(STORAGE_KEY, {
        enabled: this.state.enabled,
        preset: this.state.preset,
        bands: this.state.bands,
        bassBoost: this.state.bassBoost,
        virtualizer: this.state.virtualizer,
      })
    } catch (e) {}
  }

  subscribe(listener: (state: DspState) => void) {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.state = { ...this.state, bands: [...this.state.bands] }
    for (const l of this.listeners) {
      l(this.state)
    }
  }

  async init(audioSessionId = 0): Promise<DspState | null> {
    if (!DspModule) return null
    try {
      const res = await DspModule.initDsp(audioSessionId)
      this.inited = true
      
      const bands: BandInfo[] = res?.bands && res.bands.length > 0
        ? res.bands.map((b: any) => ({
          band: b.band,
          centerFreq: b.centerFreq,
          level: b.level ?? 0,
        }))
        : DEFAULT_BANDS

      this.state.numBands = res?.numBands ?? bands.length
      this.state.minLevel = res?.minLevel ?? -1000
      this.state.maxLevel = res?.maxLevel ?? 1000
      this.state.bands = bands

      if (this.state.preset === 'custom') {
        for (const b of this.state.bands) {
          await DspModule.setBandLevel(b.band, b.level)
        }
        await DspModule.setBassBoost(this.state.bassBoost)
        await DspModule.setVirtualizer(this.state.virtualizer)
      } else {
        await this.setPreset(this.state.preset)
      }

      await DspModule.setEnabled(this.state.enabled)
      this.notify()
      return this.state
    } catch (err) {
      console.warn('[DSP] Init error:', err)
      return null
    }
  }

  async setEnabled(enabled: boolean): Promise<boolean> {
    this.state.enabled = enabled
    this.notify()
    void this.persistState()
    if (!DspModule) return false
    try {
      await DspModule.setEnabled(enabled)
      return true
    } catch (err) {
      return false
    }
  }

  async setPreset(preset: DspPreset): Promise<boolean> {
    this.state.preset = preset
    if (preset === 'vinyl') {
      this.state.bassBoost = 250
      this.state.virtualizer = 150
      this.updateBandLevels([300, 300, 300, 150, 150, 0, 0, 0, -150, -150])
    } else if (preset === 'bass') {
      this.state.bassBoost = 800
      this.state.virtualizer = 100
      this.updateBandLevels([650, 650, 500, 300, 200, 0, 0, 0, 0, 0])
    } else if (preset === 'vocal') {
      this.state.bassBoost = 0
      this.state.virtualizer = 200
      this.updateBandLevels([-200, -150, -100, 0, 200, 500, 500, 400, 100, 0])
    } else if (preset === 'spatial') {
      this.state.bassBoost = 400
      this.state.virtualizer = 850
      this.updateBandLevels([300, 250, 200, 0, 0, 100, 200, 300, 400, 400])
    } else if (preset === 'treble') {
      this.state.bassBoost = 0
      this.state.virtualizer = 300
      this.updateBandLevels([-100, -50, 0, 0, 100, 250, 400, 600, 600, 600])
    } else if (preset === 'flat') {
      this.state.bassBoost = 0
      this.state.virtualizer = 0
      this.updateBandLevels([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    }
    this.notify()
    void this.persistState()

    if (!DspModule) return false
    try {
      await DspModule.applyPreset(preset === 'custom' ? 'flat' : preset)
      return true
    } catch (err) {
      console.warn('[DSP] Apply preset error:', err)
      return false
    }
  }

  private updateBandLevels(levels: number[]) {
    this.state.bands = this.state.bands.map((b, i) => ({
      ...b,
      level: levels[i] ?? 0,
    }))
  }

  async setBandLevel(band: number, millibels: number): Promise<boolean> {
    this.state.preset = 'custom'
    const target = this.state.bands.find(b => b.band === band)
    if (target) {
      target.level = millibels
    }
    this.notify()
    void this.persistState()
    if (!DspModule) return false
    try {
      await DspModule.setBandLevel(band, millibels)
      return true
    } catch (err) {
      return false
    }
  }

  async setBassBoost(strength: number): Promise<boolean> {
    this.state.bassBoost = Math.max(0, Math.min(1000, strength))
    this.notify()
    void this.persistState()
    if (!DspModule) return false
    try {
      await DspModule.setBassBoost(strength)
      return true
    } catch (err) {
      return false
    }
  }

  async setVirtualizer(strength: number): Promise<boolean> {
    this.state.virtualizer = Math.max(0, Math.min(1000, strength))
    this.notify()
    void this.persistState()
    if (!DspModule) return false
    try {
      await DspModule.setVirtualizer(strength)
      return true
    } catch (err) {
      return false
    }
  }

  async crossfadeIn(targetVolume = 1.0, durationMs = 800): Promise<void> {
    try {
      const steps = 16
      const stepTime = durationMs / steps
      for (let i = 1; i <= steps; i++) {
        const v = (targetVolume * i) / steps
        await TrackPlayer.setVolume(v)
        await new Promise(r => setTimeout(r, stepTime))
      }
    } catch (err) {
      await TrackPlayer.setVolume(targetVolume)
    }
  }

  async crossfadeOut(durationMs = 600): Promise<void> {
    try {
      const steps = 12
      const stepTime = durationMs / steps
      for (let i = steps - 1; i >= 0; i--) {
        const v = i / steps
        await TrackPlayer.setVolume(v)
        await new Promise(r => setTimeout(r, stepTime))
      }
    } catch (err) {}
  }
}

export const dspEngine = new DspEngine()

export function useDspState(): DspState {
  const [state, setState] = useState<DspState>(dspEngine.state)
  useEffect(() => {
    return dspEngine.subscribe(setState)
  }, [])
  return state
}

export default dspEngine
