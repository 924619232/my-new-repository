// import { setUserApi as setUserApiAction } from '@renderer/utils/ipc'
import musicSdk from '@/utils/musicSdk'
// import apiSourceInfo from '@renderer/utils/musicSdk/api-source-info'
import { updateSetting } from './common'
import settingState from '@/store/setting/state'
import { destroyUserApi, setUserApi } from './userApi'
import apiSourceInfo from '@/utils/musicSdk/api-source-info'


export const setApiSource = (apiId: string) => {
  if (global.lx.apiInitPromise[1]) {
    global.lx.apiInitPromise[0] = new Promise(resolve => {
      global.lx.apiInitPromise[1] = false
      const timer = setTimeout(() => {
        if (!global.lx.apiInitPromise[1]) {
          console.warn('apiInitPromise timed out after 5000ms, releasing lock')
          global.lx.apiInitPromise[1] = true
          resolve(false)
        }
      }, 5000)
      global.lx.apiInitPromise[2] = (result: boolean) => {
        clearTimeout(timer)
        global.lx.apiInitPromise[1] = true
        resolve(result)
      }
    })
  }
  if (apiId === 'cjy_v350_builtin') apiId = 'user_api_cjy_v350'
  if (/^user_api/.test(apiId)) {
    setUserApi(apiId).catch(err => {
      if (!global.lx.apiInitPromise[1]) global.lx.apiInitPromise[2](false)
      console.log(err)
      let api = apiSourceInfo.find(api => !api.disabled)
      if (!api) return
      if (api.id != settingState.setting['common.apiSource']) setApiSource(api.id)
    })
  } else {
    // @ts-expect-error
    global.lx.qualityList = musicSdk.supportQuality[apiId] ?? {}
    destroyUserApi()
    if (!global.lx.apiInitPromise[1]) global.lx.apiInitPromise[2](true)
    // apiSource.value = apiId
    // void setUserApiAction(apiId)
  }

  if (apiId != settingState.setting['common.apiSource']) {
    updateSetting({ 'common.apiSource': apiId })
    requestAnimationFrame(() => {
      global.state_event.apiSourceUpdated(apiId)
    })
  }
}

