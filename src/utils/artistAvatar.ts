// -*- coding: utf-8 -*-
// 歌手高清官方写真大图嗅探与缓存引擎

const AVATAR_CACHE = new Map<string, string>()

export const getArtistAvatarUrl = async(artistName: string): Promise<string | null> => {
  if (!artistName) return null
  const cleanName = String(artistName).split(/[/&,，、]/)[0].trim()
  if (!cleanName) return null

  if (AVATAR_CACHE.has(cleanName)) {
    return AVATAR_CACHE.get(cleanName)!
  }

  try {
    const url = `https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?key=${encodeURIComponent(cleanName)}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    if (res.ok) {
      const data = await res.json()
      const singerList = data?.data?.singer?.itemlist
      if (Array.isArray(singerList) && singerList.length > 0) {
        const item = singerList[0]
        let pic = item.mid ? `https://y.gtimg.cn/music/photo_new/T001R300x300M000${item.mid}.jpg` : item.pic
        if (pic) {
          pic = String(pic).replace(/^http:\/\//, 'https://')
          AVATAR_CACHE.set(cleanName, pic)
          return pic
        }
      }
    }
  } catch (e) {}

  return null
}
