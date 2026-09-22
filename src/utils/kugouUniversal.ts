import { toMD5 } from '@/utils/tools'
import { formatPlayTime2 } from '@/utils'

export const resolveKugouDirect = async (inputStr: string): Promise<{ title: string, songs: any[] } | null> => {
  try {
    const mGcid = inputStr.match(/gcid_([a-zA-Z0-9]+)/) || inputStr.match(/t\.kugou\.com\/([a-zA-Z0-9]+)/) || inputStr.match(/id=([a-zA-Z0-9]{8,24})/)
    if (!mGcid) return null
    const rawGcid = mGcid[1]

    const kgSign = (pStr: string, plat = 'android', bStr = '') => {
      const k = plat === 'android' ? 'OIlwieks28dk2k092lksi2UIkp' : 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt'
      const pList = pStr.split('&').sort().join('')
      return toMD5(k + pList + bStr + k)
    }

    const params = 'dfid=-&appid=1005&mid=0&clientver=20109&clienttime=640612895&uuid=-'
    const bodyObj = { ret_info: 1, data: [{ id: rawGcid, id_type: 2 }] }
    const bodyStr = JSON.stringify(bodyObj)
    const sig = kgSign(params, 'android', bodyStr)
    const decodeUrl = `https://t.kugou.com/v1/songlist/batch_decode?${params}&signature=${sig}`

    const rDecodeResp = await fetch(decodeUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; HUAWEI HMA-AL00)',
        Referer: 'https://m.kugou.com/',
        'Content-Type': 'application/json',
      },
      body: bodyStr,
    })
    const rDecode = await rDecodeResp.json()

    const listDecode = rDecode?.data?.list
    if (!listDecode || listDecode.length === 0) return null
    const globalId = listDecode[0].global_collection_id || listDecode[0].id
    const title = listDecode[0].name || '酷狗精选歌单'

    const nowMs = Date.now().toString()
    const pSong = `appid=1058&clienttime=${nowMs}&clientver=20000&dfid=-&global_specialid=${globalId}&mid=${nowMs}&page=1&pagesize=300&plat=0&specialid=0&srcappid=2919&uuid=${nowMs}&version=8000`
    const sigSong = kgSign(pSong, 'web')
    const songUrl = `https://mobiles.kugou.com/api/v5/special/song_v2?${pSong}&signature=${sigSong}`

    const rSongResp = await fetch(songUrl, {
      headers: {
        Referer: 'https://m3ws.kugou.com/share/index.php',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X)',
        mid: nowMs,
        dfid: '-',
        clienttime: nowMs,
      },
    })
    const rSong = await rSongResp.json()
    const songInfo = rSong?.data?.info || []

    if (!Array.isArray(songInfo) || songInfo.length === 0) return null

    const songs = songInfo.map((s: any) => {
      const fn = s.filename || ''
      const parts = fn.split(' - ')
      const artist = parts.length > 1 ? parts[0].trim() : (s.singername || '未知歌手')
      const songTitle = parts.length > 1 ? parts[1].trim() : fn.trim()
      const hash = s.hash || ''
      const dur = s.duration || 210
      const cover = (s.trans_param?.union_cover || '').replace('{size}', '300').replace('http://', 'https://')
      const album = s.remark || '官方正版专辑'

      return {
        id: `kg_${hash}`,
        title: songTitle,
        name: songTitle,
        artist,
        singer: artist,
        album,
        albumName: album,
        duration: formatPlayTime2(dur),
        interval: dur,
        pic_url: cover,
        cover_url: cover,
        img: cover,
        hash,
        source: 'kg',
        types: [{ type: '128k' }, { type: '320k' }, { type: 'flac' }, { type: 'flac24bit' }],
      }
    })

    return { title, songs }
  } catch (e) {
    console.log('[resolveKugouDirect error]', e)
    return null
  }
}
