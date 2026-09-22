package cn.toside.music.mobile.dsp;

import android.media.audiofx.BassBoost;
import android.media.audiofx.Equalizer;
import android.media.audiofx.Virtualizer;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

public class DspModule extends ReactContextBaseJavaModule {
  private static final String TAG = "DspModule";
  private final ReactApplicationContext reactContext;

  private Equalizer equalizer = null;
  private BassBoost bassBoost = null;
  private Virtualizer virtualizer = null;
  private boolean isEnabled = true;

  public DspModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "DspModule";
  }

  @ReactMethod
  public void initDsp(int audioSessionId, Promise promise) {
    try {
      releaseInternal();
      int session = audioSessionId > 0 ? audioSessionId : 0;

      equalizer = new Equalizer(0, session);
      equalizer.setEnabled(isEnabled);

      bassBoost = new BassBoost(0, session);
      bassBoost.setEnabled(isEnabled);

      virtualizer = new Virtualizer(0, session);
      virtualizer.setEnabled(isEnabled);

      short bands = equalizer.getNumberOfBands();
      short[] levelRange = equalizer.getBandLevelRange();

      WritableMap map = Arguments.createMap();
      map.putInt("numBands", bands);
      map.putInt("minLevel", levelRange[0]);
      map.putInt("maxLevel", levelRange[1]);

      WritableArray bandFreqs = Arguments.createArray();
      for (short i = 0; i < bands; i++) {
        WritableMap b = Arguments.createMap();
        b.putInt("band", i);
        b.putInt("centerFreq", equalizer.getCenterFreq(i) / 1000);
        b.putInt("level", equalizer.getBandLevel(i));
        bandFreqs.pushMap(b);
      }
      map.putArray("bands", bandFreqs);

      promise.resolve(map);
    } catch (Exception e) {
      Log.e(TAG, "Failed to init DSP: " + e.getMessage(), e);
      promise.reject("ERR_DSP_INIT", e.getMessage());
    }
  }

  @ReactMethod
  public void setEnabled(boolean enabled, Promise promise) {
    this.isEnabled = enabled;
    try {
      if (equalizer != null) equalizer.setEnabled(enabled);
      if (bassBoost != null) bassBoost.setEnabled(enabled);
      if (virtualizer != null) virtualizer.setEnabled(enabled);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("ERR_DSP_ENABLE", e.getMessage());
    }
  }

  @ReactMethod
  public void setBandLevel(int band, int millibels, Promise promise) {
    try {
      if (equalizer != null) {
        equalizer.setBandLevel((short) band, (short) millibels);
      }
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("ERR_SET_BAND", e.getMessage());
    }
  }

  @ReactMethod
  public void setBassBoost(int strength, Promise promise) {
    try {
      if (bassBoost != null && bassBoost.getStrengthSupported()) {
        bassBoost.setStrength((short) Math.max(0, Math.min(1000, strength)));
      }
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("ERR_BASS_BOOST", e.getMessage());
    }
  }

  @ReactMethod
  public void setVirtualizer(int strength, Promise promise) {
    try {
      if (virtualizer != null && virtualizer.getStrengthSupported()) {
        virtualizer.setStrength((short) Math.max(0, Math.min(1000, strength)));
      }
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("ERR_VIRTUALIZER", e.getMessage());
    }
  }

  @ReactMethod
  public void applyPreset(String preset, Promise promise) {
    try {
      if (equalizer == null) {
        promise.resolve(false);
        return;
      }
      short bands = equalizer.getNumberOfBands();

      switch (preset.toLowerCase()) {
        case "vinyl":
          for (short i = 0; i < bands; i++) {
            int freq = equalizer.getCenterFreq(i) / 1000;
            if (freq <= 250) equalizer.setBandLevel(i, (short) 300);
            else if (freq <= 1000) equalizer.setBandLevel(i, (short) 150);
            else if (freq >= 8000) equalizer.setBandLevel(i, (short) -150);
            else equalizer.setBandLevel(i, (short) 0);
          }
          if (bassBoost != null) bassBoost.setStrength((short) 250);
          if (virtualizer != null) virtualizer.setStrength((short) 150);
          break;

        case "bass":
          for (short i = 0; i < bands; i++) {
            int freq = equalizer.getCenterFreq(i) / 1000;
            if (freq <= 125) equalizer.setBandLevel(i, (short) 650);
            else if (freq <= 500) equalizer.setBandLevel(i, (short) 300);
            else equalizer.setBandLevel(i, (short) 0);
          }
          if (bassBoost != null) bassBoost.setStrength((short) 800);
          if (virtualizer != null) virtualizer.setStrength((short) 100);
          break;

        case "vocal":
          for (short i = 0; i < bands; i++) {
            int freq = equalizer.getCenterFreq(i) / 1000;
            if (freq <= 125) equalizer.setBandLevel(i, (short) -200);
            else if (freq >= 1000 && freq <= 4000) equalizer.setBandLevel(i, (short) 500);
            else equalizer.setBandLevel(i, (short) 100);
          }
          if (bassBoost != null) bassBoost.setStrength((short) 0);
          if (virtualizer != null) virtualizer.setStrength((short) 200);
          break;

        case "spatial":
          for (short i = 0; i < bands; i++) {
            int freq = equalizer.getCenterFreq(i) / 1000;
            if (freq <= 125) equalizer.setBandLevel(i, (short) 300);
            else if (freq >= 8000) equalizer.setBandLevel(i, (short) 400);
            else equalizer.setBandLevel(i, (short) 0);
          }
          if (bassBoost != null) bassBoost.setStrength((short) 400);
          if (virtualizer != null) virtualizer.setStrength((short) 850);
          break;

        case "treble":
          for (short i = 0; i < bands; i++) {
            int freq = equalizer.getCenterFreq(i) / 1000;
            if (freq >= 4000) equalizer.setBandLevel(i, (short) 600);
            else if (freq >= 2000) equalizer.setBandLevel(i, (short) 250);
            else equalizer.setBandLevel(i, (short) 0);
          }
          if (bassBoost != null) bassBoost.setStrength((short) 0);
          if (virtualizer != null) virtualizer.setStrength((short) 300);
          break;

        case "flat":
        default:
          for (short i = 0; i < bands; i++) {
            equalizer.setBandLevel(i, (short) 0);
          }
          if (bassBoost != null) bassBoost.setStrength((short) 0);
          if (virtualizer != null) virtualizer.setStrength((short) 0);
          break;
      }

      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("ERR_APPLY_PRESET", e.getMessage());
    }
  }

  private void releaseInternal() {
    try {
      if (equalizer != null) { equalizer.release(); equalizer = null; }
      if (bassBoost != null) { bassBoost.release(); bassBoost = null; }
      if (virtualizer != null) { virtualizer.release(); virtualizer = null; }
    } catch (Exception e) {
      Log.w(TAG, "Error releasing DSP: " + e.getMessage());
    }
  }

  @ReactMethod
  public void release(Promise promise) {
    releaseInternal();
    promise.resolve(true);
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    releaseInternal();
  }
}
