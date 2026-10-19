package cn.toside.music.mobile.utils;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Rect;
import android.net.Uri;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.media.AudioManager;
import android.media.AudioPlaybackConfiguration;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import android.view.Window;
import android.view.WindowManager;

import androidx.core.app.LocaleManagerCompat;
import androidx.core.content.FileProvider;
import androidx.core.os.LocaleListCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;

import java.io.File;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

public class UtilsModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;

  private int listenerCount = 0;

  UtilsEvent utilsEvent;
  private AudioManager.AudioPlaybackCallback audioPlaybackCallback = null;
  private AudioManager.OnAudioFocusChangeListener audioFocusChangeListener = null;
  private boolean isOtherAppPlaying = false;
  private boolean isNativePausedByInterruption = false;
  private PowerManager.WakeLock interruptionWakeLock = null;
  private final Handler watchdogHandler = new Handler(Looper.getMainLooper());
  private Runnable watchdogRunnable = null;

  UtilsModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    utilsEvent = new UtilsEvent(reactContext);
    try {
      PowerManager pm = (PowerManager) reactContext.getSystemService(Context.POWER_SERVICE);
      if (pm != null) {
        interruptionWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LXMusic:InterruptionWakeLock");
        interruptionWakeLock.setReferenceCounted(false);
      }
    } catch (Throwable t) {
      Log.e("UtilsModule", "Init WakeLock error: " + t.getMessage());
    }
    registerScreenBroadcastReceiver();
    registerAudioPlaybackListener();
    registerNativeAudioFocusListener();
  }

  @Override
  public String getName() {
    return "UtilsModule";
  }

  @ReactMethod
  public void addListener(String eventName) {
    if (listenerCount == 0) {
      // Set up any upstream listeners or background tasks as necessary
    }

    listenerCount += 1;
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    listenerCount -= count;
    if (listenerCount == 0) {
      // Remove upstream listeners, stop unnecessary background tasks
    }
  }

  private void registerScreenBroadcastReceiver() {
    final IntentFilter theFilter = new IntentFilter();
    /** System Defined Broadcast */
    theFilter.addAction(Intent.ACTION_SCREEN_ON);
    theFilter.addAction(Intent.ACTION_SCREEN_OFF);

    BroadcastReceiver screenOnOffReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        String strAction = intent.getAction();

        WritableMap params = Arguments.createMap();

        switch (Objects.requireNonNull(strAction)) {
          case Intent.ACTION_SCREEN_OFF:

            params.putString("state", "OFF");
            utilsEvent.sendEvent(utilsEvent.SCREEN_STATE, params);
            break;
          case Intent.ACTION_SCREEN_ON:
            params.putString("state", "ON");
            utilsEvent.sendEvent(utilsEvent.SCREEN_STATE, params);
            break;
        }
      }
    };

    reactContext.registerReceiver(screenOnOffReceiver, theFilter);
  }

  @ReactMethod
  public void exitApp() {
    // https://github.com/wumke/react-native-exit-app/blob/master/android/src/main/java/com/github/wumke/RNExitApp/RNExitAppModule.java
    // android.os.Process.killProcess(android.os.Process.myPid());

    // https://stackoverflow.com/questions/6330200/how-to-quit-android-application-programmatically
    Activity currentActivity = reactContext.getCurrentActivity();
    Log.d("Utils", "Exit app...");
    if (currentActivity == null) {
      Log.d("Utils", "killProcess");
      android.os.Process.killProcess(android.os.Process.myPid());
    } else {
      currentActivity.finishAndRemoveTask();
      System.exit(0);
    }
  }

  @ReactMethod
  public void getSupportedAbis(Promise promise) {
    // https://github.com/react-native-device-info/react-native-device-info/blob/ff8f672cb08fa39a887567d6e23e2f08778e8340/android/src/main/java/com/learnium/RNDeviceInfo/RNDeviceModule.java#L877
    WritableArray array = new WritableNativeArray();
    for (String abi : Build.SUPPORTED_ABIS) {
      array.pushString(abi);
    }
    promise.resolve(array);
  }

  @ReactMethod
  public void installApk(String filePath, String fileProviderAuthority, Promise promise) {
    File file = new File(filePath);
    if (!file.exists()) {
      Log.e("Utils", "installApk: file does not exist '" + filePath + "'");
      promise.reject("Utils", "installApk: file does not exist '" + filePath + "'");
      return;
    }

    if (Build.VERSION.SDK_INT >= 24) {
      Uri contentUri;
      String authority = fileProviderAuthority;
      if (authority == null || authority.isEmpty() || authority.startsWith("cn.toside.music.mobile")) {
        authority = reactContext.getPackageName() + ".provider";
      }
      try {
        contentUri = FileProvider.getUriForFile(getReactApplicationContext(), authority, file);
      } catch (Exception e) {
        Log.w("Utils", "FileProvider failed with authority: " + authority + ", retrying with packageName.provider");
        try {
          authority = reactContext.getPackageName() + ".provider";
          contentUri = FileProvider.getUriForFile(getReactApplicationContext(), authority, file);
        } catch (Exception ex) {
          Log.e("Utils", "installApk exception with authority name '" + authority + "'", ex);
          promise.reject("Utils", "installApk exception with authority name '" + authority + "': " + ex.getMessage());
          return;
        }
      }
      try {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.setDataAndType(contentUri, "application/vnd.android.package-archive");
        reactContext.startActivity(intent);
        promise.resolve(null);
      } catch (Exception e) {
        Log.e("Utils", "installApk startActivity failed: " + e.getMessage(), e);
        promise.reject("Utils", "installApk startActivity failed: " + e.getMessage());
      }
    } else {
      // Old APIs do not handle content:// URIs, so use an old file:// style
      String cmd = "chmod 777 " + file;
      try {
        Runtime.getRuntime().exec(cmd);
      } catch (Exception e) {
        // e.printStackTrace();
        Log.e("Utils", "installApk exception : " + e.getMessage(), e);
        promise.reject("Utils", e.getMessage());
      }
      Intent intent = new Intent(Intent.ACTION_VIEW);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      intent.setDataAndType(Uri.parse("file://" + file), "application/vnd.android.package-archive");
      reactContext.startActivity(intent);
      promise.resolve(null);
    }
  }

  @ReactMethod
  public void screenkeepAwake() {
    // https://github.com/corbt/react-native-keep-awake/blob/master/android/src/main/java/com/corbt/keepawake/KCKeepAwake.java
    final Activity activity = getCurrentActivity();

    if (activity != null) {
      activity.runOnUiThread(() -> {
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
      });
    }
  }

  @ReactMethod
  public void screenUnkeepAwake() {
    // https://github.com/corbt/react-native-keep-awake/blob/master/android/src/main/java/com/corbt/keepawake/KCKeepAwake.java
    final Activity activity = getCurrentActivity();

    if (activity != null) {
      activity.runOnUiThread(() -> {
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
      });
    }
  }

  /**
   Gets the device's WiFi interface IP address
   @return device's WiFi IP if connected to WiFi, else '0.0.0.0'
   */
  @ReactMethod
  public void getWIFIIPV4Address(final Promise promise) throws Exception {
    // https://github.com/pusherman/react-native-network-info/blob/master/android/src/main/java/com/pusherman/networkinfo/RNNetworkInfo.java
    WifiManager wifi = (WifiManager) reactContext.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
    new Thread(new Runnable() {
      public void run() {
        try {
          WifiInfo info = wifi.getConnectionInfo();
          int ipAddress = info.getIpAddress();
          @SuppressLint("DefaultLocale") String stringip = String.format("%d.%d.%d.%d", (ipAddress & 0xff), (ipAddress >> 8 & 0xff),
            (ipAddress >> 16 & 0xff), (ipAddress >> 24 & 0xff));
          promise.resolve(stringip);
        }catch (Exception e) {
          promise.resolve(null);
        }
      }
    }).start();
  }

  // https://stackoverflow.com/a/26117646
  @ReactMethod
  public void getDeviceName(final Promise promise) {
    String manufacturer = Build.MANUFACTURER;
    String model = Build.MODEL;
    if (model.startsWith(manufacturer)) {
      promise.resolve(capitalize(model));
    } else {
      promise.resolve(capitalize(manufacturer) + " " + model);
    }
  }
  private String capitalize(String s) {
    if (s == null || s.isEmpty()) {
      return "";
    }
    char first = s.charAt(0);
    if (Character.isUpperCase(first)) {
      return s;
    } else {
      return Character.toUpperCase(first) + s.substring(1);
    }
  }

  @ReactMethod
  public void isNotificationsEnabled(final Promise promise) {
    new Thread(() -> {
      boolean enabled = NotificationPermissionUtil.isNotificationsEnabled(
        reactContext.getApplicationContext());
      promise.resolve(enabled);
    }).start();
  }

  @ReactMethod
  public void openNotificationPermissionActivity(Promise promise) {
    new Thread(() -> {
      boolean result = NotificationPermissionUtil.openNotificationPermissionActivity(
        reactContext.getApplicationContext());
      promise.resolve(result);
    }).start();
  }

  @ReactMethod
  public void shareText(String shareTitle, String title, String text) {
    Intent shareIntent = new Intent(Intent.ACTION_SEND);
    shareIntent.setType("text/plain");
    shareIntent.putExtra(Intent.EXTRA_TEXT,text);
    shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
    Objects.requireNonNull(reactContext.getCurrentActivity()).startActivity(Intent.createChooser(shareIntent, shareTitle));
  }

  // https://stackoverflow.com/questions/73463341/in-per-app-language-how-to-get-app-locale-in-api-33-if-system-locale-is-diffe
  @ReactMethod
  public void getSystemLocales(Promise promise) {
    Locale locale = null;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      LocaleListCompat list = LocaleManagerCompat.getSystemLocales(reactContext);
      if (!list.isEmpty()) {
        locale = list.get(0);
      } else {
        promise.resolve(null);
        return;
      }
    } else {
      locale = Locale.getDefault();
    }
    if (locale == null) {
      promise.resolve("");
      return;
    }

    // 格式化成 zh_cn、en_us 等
    String language = locale.getLanguage(); // zh, en
    String country = locale.getCountry();   // CN, US
    String localeStr;

    if (!country.isEmpty()) {
      localeStr = language.toLowerCase() + "_" + country.toLowerCase();
    } else {
      localeStr = language.toLowerCase();
    }

    promise.resolve(localeStr);
  }

  // https://github.com/Anthonyzou/react-native-full-screen/blob/master/android/src/main/java/com/rn/full/screen/FullScreen.java
  //  @ReactMethod
  //  public void onFullScreen() {
  //    UiThreadUtil.runOnUiThread(() -> {
  //      Activity currentActivity = reactContext.getCurrentActivity();
  //      if (currentActivity == null) return;
  //      currentActivity.getWindow().getDecorView().setSystemUiVisibility(
  //        View.SYSTEM_UI_FLAG_LAYOUT_STABLE
  //          | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
  //          | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
  //          | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION // hide nav bar
  //          | View.SYSTEM_UI_FLAG_FULLSCREEN // hide status bar
  //          | View.SYSTEM_UI_FLAG_IMMERSIVE
  //      );
  //    });
  //  }
  //  @ReactMethod
  //  public void offFullScreen() {
  //    UiThreadUtil.runOnUiThread(() -> {
  //      Activity currentActivity = reactContext.getCurrentActivity();
  //      if (currentActivity == null) return;
  //      currentActivity.getWindow().getDecorView().setSystemUiVisibility(
  //        View.SYSTEM_UI_FLAG_LAYOUT_STABLE
  //          | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
  //          | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
  //      );
  //    });
  //  }

  @ReactMethod
  public void getWindowSize(Promise promise) {
    WritableMap params = Arguments.createMap();

    Activity currentActivity = reactContext.getCurrentActivity();
    if (currentActivity == null) {
      params.putInt("width", 0);
      params.putInt("height", 0);
      promise.resolve(params);
      return;
    }
    // 获取当前应用可用区域大小
    Window window = currentActivity.getWindow();
    Rect rect = new Rect();
    window.getDecorView().getWindowVisibleDisplayFrame(rect);
    // View decorView = window.getDecorView();
    // int width = decorView.getMeasuredWidth();
    // int height = decorView.getMeasuredHeight();
    params.putInt("width", rect.width());
    params.putInt("height", rect.height());
    promise.resolve(params);
  }

  @ReactMethod
  public void isIgnoringBatteryOptimization(Promise promise) {
    new Thread(() -> {
      boolean result = BatteryOptimizationUtil.isIgnoringBatteryOptimization(
        reactContext.getApplicationContext(),
        reactContext.getPackageName()
      );
      promise.resolve(result);
    }).start();
  }

  @ReactMethod
  public void requestIgnoreBatteryOptimization(Promise promise) {
    new Thread(() -> {
      try {
        boolean result = BatteryOptimizationUtil.requestIgnoreBatteryOptimization(
          reactContext.getApplicationContext(),
          reactContext.getPackageName()
        );
        promise.resolve(result);
      } catch (Exception e) {
        promise.reject("ERROR", e);
      }
    }).start();
  }

  private void registerAudioPlaybackListener() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
    try {
      AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
      if (audioManager == null) return;
      audioPlaybackCallback = new AudioManager.AudioPlaybackCallback() {
        @Override
        public void onPlaybackConfigChanged(List<AudioPlaybackConfiguration> configs) {
          super.onPlaybackConfigChanged(configs);
          handleAudioPlaybackConfigs(configs);
        }
      };
      audioManager.registerAudioPlaybackCallback(audioPlaybackCallback, new Handler(Looper.getMainLooper()));
      Log.i("UtilsModule", "Registered AudioPlaybackCallback successfully");
    } catch (Throwable t) {
      Log.e("UtilsModule", "Failed to register AudioPlaybackCallback: " + t.getMessage());
    }
  }

  private int getConfigClientUid(AudioPlaybackConfiguration config) {
    try {
      java.lang.reflect.Method m = config.getClass().getMethod("getClientUid");
      Object res = m.invoke(config);
      if (res instanceof Integer) return (Integer) res;
    } catch (Throwable ignored) {}
    return -1;
  }

  private int getConfigPlayerState(AudioPlaybackConfiguration config) {
    try {
      java.lang.reflect.Method m = config.getClass().getMethod("getPlayerState");
      Object res = m.invoke(config);
      if (res instanceof Integer) return (Integer) res;
    } catch (Throwable ignored) {}
    return 2; // Default to started (PLAYER_STATE_STARTED = 2)
  }

  private void handleAudioPlaybackConfigs(List<AudioPlaybackConfiguration> configs) {
    try {
      AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
      if (audioManager == null) return;
      boolean isMusicActive = audioManager.isMusicActive();
      int mode = audioManager.getMode();
      boolean isCallActive = (mode == AudioManager.MODE_IN_CALL || mode == AudioManager.MODE_IN_COMMUNICATION);
      boolean hasOther = isMusicActive || isCallActive;

      if (configs != null && !configs.isEmpty()) {
        int myUid = android.os.Process.myUid();
        for (AudioPlaybackConfiguration config : configs) {
          try {
            int uid = getConfigClientUid(config);
            if (uid > 0 && uid != myUid) {
              int state = getConfigPlayerState(config);
              if (state == 2) { // 2 = PLAYER_STATE_STARTED
                hasOther = true;
                break;
              }
            }
          } catch (Throwable ignored) {}
        }
      }

      if (hasOther != isOtherAppPlaying) {
        isOtherAppPlaying = hasOther;
        if (!isOtherAppPlaying) {
          Log.i("UtilsModule", "Other app audio ended! Emitting other-app-audio-ended event...");
          utilsEvent.sendEvent("other-app-audio-ended", null);
        } else {
          Log.i("UtilsModule", "Other app audio started! Emitting other-app-audio-started event...");
          utilsEvent.sendEvent("other-app-audio-started", null);
        }
      }
    } catch (Throwable t) {
      Log.e("UtilsModule", "handleAudioPlaybackConfigs error: " + t.getMessage());
    }
  }

  @ReactMethod
  public void isOtherAppPlayingAudio(Promise promise) {
    try {
      AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
      if (audioManager == null) {
        promise.resolve(false);
        return;
      }
      boolean isMusicActive = audioManager.isMusicActive();
      int mode = audioManager.getMode();
      boolean isCallActive = (mode == AudioManager.MODE_IN_CALL || mode == AudioManager.MODE_IN_COMMUNICATION);
      boolean hasOther = isMusicActive || isCallActive;

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        List<AudioPlaybackConfiguration> configs = audioManager.getActivePlaybackConfigurations();
        if (configs != null && !configs.isEmpty()) {
          int myUid = android.os.Process.myUid();
          for (AudioPlaybackConfiguration config : configs) {
            try {
              int uid = getConfigClientUid(config);
              if (uid > 0 && uid != myUid) {
                int state = getConfigPlayerState(config);
                if (state == 2) {
                  hasOther = true;
                  break;
                }
              }
            } catch (Throwable ignored) {}
          }
        }
      }
      promise.resolve(hasOther);
    } catch (Throwable t) {
      Log.e("UtilsModule", "isOtherAppPlayingAudio error: " + t.getMessage());
      promise.resolve(false);
    }
  }

  private void registerNativeAudioFocusListener() {
    try {
      AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
      if (audioManager == null) return;
      audioFocusChangeListener = focusChange -> {
        Log.i("UtilsModule", "[NativeFocus] onAudioFocusChange: " + focusChange);
        switch (focusChange) {
          case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
          case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
            isNativePausedByInterruption = true;
            Log.i("UtilsModule", "[NativeFocus] Transient audio focus loss recorded.");
            break;
          case AudioManager.AUDIOFOCUS_GAIN:
            if (isNativePausedByInterruption) {
              isNativePausedByInterruption = false;
              Log.i("UtilsModule", "[NativeFocus] AUDIOFOCUS_GAIN received! Emitting other-app-audio-ended event directly...");
              utilsEvent.sendEvent("other-app-audio-ended", null);
            }
            break;
          case AudioManager.AUDIOFOCUS_LOSS:
            isNativePausedByInterruption = false;
            Log.i("UtilsModule", "[NativeFocus] Permanent audio focus loss.");
            break;
        }
      };
    } catch (Throwable t) {
      Log.e("UtilsModule", "registerNativeAudioFocusListener error: " + t.getMessage());
    }
  }

  private boolean checkAnyOtherAppPlaying() {
    try {
      AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
      if (audioManager == null) return false;
      boolean isMusicActive = audioManager.isMusicActive();
      int mode = audioManager.getMode();
      boolean isCallActive = (mode == AudioManager.MODE_IN_CALL || mode == AudioManager.MODE_IN_COMMUNICATION);
      if (isMusicActive || isCallActive) return true;

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        List<AudioPlaybackConfiguration> configs = audioManager.getActivePlaybackConfigurations();
        if (configs != null && !configs.isEmpty()) {
          int myUid = android.os.Process.myUid();
          for (AudioPlaybackConfiguration config : configs) {
            try {
              int uid = getConfigClientUid(config);
              if (uid > 0 && uid != myUid) {
                int state = getConfigPlayerState(config);
                if (state == 2) { // 2 = PLAYER_STATE_STARTED
                  return true;
                }
              }
            } catch (Throwable ignored) {}
          }
        }
      }
    } catch (Throwable t) {
      Log.e("UtilsModule", "checkAnyOtherAppPlaying error: " + t.getMessage());
    }
    return false;
  }

  private void keepNotificationOngoing(boolean ongoing) {
    try {
      NotificationManager nm = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
      if (nm == null) return;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        StatusBarNotification[] sbns = nm.getActiveNotifications();
        if (sbns != null) {
          for (StatusBarNotification sbn : sbns) {
            if (sbn.getId() == 1) { // TrackPlayer notification id is 1
              Notification n = sbn.getNotification();
              if (n != null) {
                if (ongoing) {
                  n.flags |= (Notification.FLAG_ONGOING_EVENT | Notification.FLAG_NO_CLEAR);
                } else {
                  n.flags &= ~Notification.FLAG_NO_CLEAR;
                }
                nm.notify(1, n);
                Log.i("UtilsModule", "[FluidCloud] Successfully updated notification ongoing=" + ongoing);
              }
              break;
            }
          }
        }
      }
    } catch (Throwable t) {
      Log.e("UtilsModule", "keepNotificationOngoing error: " + t.getMessage());
    }
  }

  private void startNativeFocusWatchdog() {
    stopNativeFocusWatchdog();
    watchdogRunnable = new Runnable() {
      private int probeCount = 0;
      @Override
      public void run() {
        if (!isNativePausedByInterruption) return;
        probeCount++;
        if (probeCount > 50) { // 50 * 800ms = 40s
          Log.i("UtilsModule", "[NativeFocusWatchdog] Watchdog timeout (>40s), stopping.");
          notifyAudioInterruptionState(false);
          return;
        }
        boolean hasOther = checkAnyOtherAppPlaying();
        Log.i("UtilsModule", "[NativeFocusWatchdog] Probe #" + probeCount + ": hasOtherAudio=" + hasOther);
        if (!hasOther && isNativePausedByInterruption) {
          Log.i("UtilsModule", "[NativeFocusWatchdog] External audio stopped in background! Emitting resume event NOW!");
          isNativePausedByInterruption = false;
          if (interruptionWakeLock != null && interruptionWakeLock.isHeld()) {
            try { interruptionWakeLock.release(); } catch (Throwable ignored) {}
          }
          keepNotificationOngoing(false);
          utilsEvent.sendEvent("other-app-audio-ended", null);
          return;
        }
        watchdogHandler.postDelayed(this, 800);
      }
    };
    watchdogHandler.postDelayed(watchdogRunnable, 800);
  }

  private void stopNativeFocusWatchdog() {
    if (watchdogRunnable != null) {
      watchdogHandler.removeCallbacks(watchdogRunnable);
      watchdogRunnable = null;
    }
  }

  @ReactMethod
  public void notifyAudioInterruptionState(boolean isInterrupted) {
    this.isNativePausedByInterruption = isInterrupted;
    Log.i("UtilsModule", "[NativeFocus] notifyAudioInterruptionState: " + isInterrupted);

    if (isInterrupted) {
      // 1. 立即获取 WakeLock，保持 CPU 处于活动状态，杜绝 ColorOS 深度休眠 JS 线程与回调
      if (interruptionWakeLock != null && !interruptionWakeLock.isHeld()) {
        try {
          interruptionWakeLock.acquire(60000); // 60 秒安全超时兜底
          Log.i("UtilsModule", "[NativeFocus] Acquired InterruptionWakeLock (60s timeout)");
        } catch (Throwable t) {
          Log.e("UtilsModule", "Acquire WakeLock error: " + t.getMessage());
        }
      }
      // 2. 增强通知栏常驻属性（保持 FLAG_ONGOING_EVENT，守护 ColorOS 15 流体云胶囊）
      keepNotificationOngoing(true);
      // 3. 启动原生高精度看门狗（每 800ms 探活一次外部音频）
      startNativeFocusWatchdog();
    } else {
      // 打断恢复，释放 WakeLock，停止原生看门狗
      stopNativeFocusWatchdog();
      if (interruptionWakeLock != null && interruptionWakeLock.isHeld()) {
        try {
          interruptionWakeLock.release();
          Log.i("UtilsModule", "[NativeFocus] Released InterruptionWakeLock");
        } catch (Throwable t) {
          Log.e("UtilsModule", "Release WakeLock error: " + t.getMessage());
        }
      }
      keepNotificationOngoing(false);
    }
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    stopNativeFocusWatchdog();
    if (interruptionWakeLock != null && interruptionWakeLock.isHeld()) {
      try { interruptionWakeLock.release(); } catch (Throwable ignored) {}
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioPlaybackCallback != null) {
      try {
        AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null) {
          audioManager.unregisterAudioPlaybackCallback(audioPlaybackCallback);
        }
      } catch (Throwable ignored) {}
    }
  }
}

