import { NativeModules } from 'react-native'
import TrackPlayer from 'react-native-track-player'

const { DspModule } = NativeModules

export type DspPreset = 'vinyl' | 'bass' | 'vocal' | 'spatial' | 'treble' | 'flat'

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

class DspEngine {
  private inited = false
  private currentPreset: DspPreset = 'vinyl'

  async init(audioSessionId = 0): Promise<DspState | null> {
    if (!DspModule) return null
    try {
      const res = await DspModule.initDsp(audioSessionId)
      this.inited = true
      await this.setPreset('vinyl')
      return {
        enabled: true,
        preset: 'vinyl',
        numBands: res.numBands,
        minLevel: res.minLevel,
        maxLevel: res.maxLevel,
        bands: res.bands || [],
        bassBoost: 250,
        virtualizer: 150,
      }
    } catch (err) {
      console.warn('[DSP] Init error:', err)
      return null
    }
  }

  async setPreset(preset: DspPreset): Promise<boolean> {
    if (!DspModule) return false
    try {
      this.currentPreset = preset
      await DspModule.applyPreset(preset)
      return true
    } catch (err) {
      console.warn('[DSP] Apply preset error:', err)
      return false
    }
  }

  async setBandLevel(band: number, millibels: number): Promise<boolean> {
    if (!DspModule) return false
    try {
      await DspModule.setBandLevel(band, millibels)
      return true
    } catch (err) {
      return false
    }
  }

  async setBassBoost(strength: number): Promise<boolean> {
    if (!DspModule) return false
    try {
      await DspModule.setBassBoost(strength)
      return true
    } catch (err) {
      return false
    }
  }

  async setVirtualizer(strength: number): Promise<boolean> {
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
export default dspEngine
