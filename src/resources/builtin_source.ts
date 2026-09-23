// Auto-generated built-in v3.6.0 domestic direct source
const builtinSource: string = `/*!
 * @name 官方双轨车载FLAC无损直解 (国内秒播版)
 * @description 科鲁泽车机 + 天宝奇瑞车机 · 2000k FLAC 原生直推 · 100ms 极速秒播
 * @version 3.6.0
 * @author LX
 * @homepage https://music.cjy.qzz.io
 */

const { EVENT_NAMES, on, send, request } = globalThis.lx;

// ── 0. 客户端 LRU 内存级缓存 (0ms 瞬间秒起) ──
const urlCache = new Map();
const CACHE_MAX = 500;
const CACHE_TTL = 3600 * 1000; // 1小时有效

const getCachedUrl = (key) => {
  if (!urlCache.has(key)) return null;
  const item = urlCache.get(key);
  if (Date.now() - item.time > CACHE_TTL) {
    urlCache.delete(key);
    return null;
  }
  return item.url;
};

const setCachedUrl = (key, url) => {
  if (urlCache.size >= CACHE_MAX) {
    const firstKey = urlCache.keys().next().value;
    urlCache.delete(firstKey);
  }
  urlCache.set(key, { url, time: Date.now() });
};

// ── 1. 原生 HTTP 异步请求封装 ──
const httpGet = (url, options) => new Promise((resolve, reject) => {
  try {
    const opts = Object.assign({
      method: 'GET',
      headers: {
        'User-Agent': 'okhttp/3.14.9'
      },
      timeout: 2500
    }, options || {});
    
    const req = request(url, opts, (err, resp, body) => {
      if (err) return reject(err);
      resolve({ resp, body: body || (resp && (resp.body || resp.data)) || resp });
    });
    if (req && typeof req.then === 'function') {
      req.then(r => resolve({ resp: r, body: (r && (r.body || r.data)) || r })).catch(reject);
    }
  } catch (e) {
    reject(e);
  }
});

// 安全 JSON 解析（严禁 new Function / eval，杜绝沙箱异常）
const parseSafeJson = (raw) => {
  if (typeof raw === 'object' && raw !== null) return raw;
  if (typeof raw !== 'string') return null;
  const str = raw.trim();
  try { return JSON.parse(str); } catch(e) {}
  try {
    const sanitized = str.replace(/'/g, '"');
    return JSON.parse(sanitized);
  } catch(e2) {
    return null;
  }
};

// ── 2. 车载双轨 2000k FLAC 真无损直解通道 ──
// 通道一：科鲁泽车载原生 2000k FLAC (kwplayer_ar_8.5.5.0_apk_keluze.apk)
const fetchKeluzeCarFlac = async (cleanRid) => {
  const mobiUrl = 'https://mobi.kuwo.cn/mobi.s?f=web&source=kwplayer_ar_8.5.5.0_apk_keluze.apk&type=convert_url_with_sign&rid=' + encodeURIComponent(cleanRid) + '&br=2000kflac&user=0';
  try {
    const { body } = await httpGet(mobiUrl, { timeout: 2000 });
    const data = typeof body === 'string' ? parseSafeJson(body) : body;
    const direct = data && data.data && data.data.url;
    if (direct && typeof direct === 'string' && direct.startsWith('http')) {
      console.log('[CarFlac] Keluze hit:', cleanRid, direct.substring(0, 80));
      return direct;
    }
  } catch (e) {}
  return null;
};

// 通道二：天宝奇瑞车载原生 2000k FLAC (kwplayerhd_ar_4.3.0.8_tianbao_T1A_qirui.apk)
const fetchTianbaoCarFlac = async (cleanRid) => {
  const mobiUrl = 'https://mobi.kuwo.cn/mobi.s?f=web&user=123456&source=kwplayerhd_ar_4.3.0.8_tianbao_T1A_qirui.apk&type=convert_url_with_sign&br=2000kflac&rid=' + encodeURIComponent(cleanRid);
  try {
    const { body } = await httpGet(mobiUrl, { timeout: 2000 });
    const data = typeof body === 'string' ? parseSafeJson(body) : body;
    const direct = data && data.data && data.data.url;
    if (direct && typeof direct === 'string' && direct.startsWith('http')) {
      console.log('[CarFlac] Tianbao hit:', cleanRid, direct.substring(0, 80));
      return direct;
    }
  } catch (e) {}
  return null;
};

// 车载 FLAC 竞速获取
const fetchCarFlacStream = async (cleanRid) => {
  if (!cleanRid) return null;
  let url = await fetchKeluzeCarFlac(cleanRid);
  if (!url) {
    url = await fetchTianbaoCarFlac(cleanRid);
  }
  return url;
};

// ── 3. 极速智能原唱匹配搜索 (完全复刻 Web 端 index.html 8858-8908 算法) ──
const resolveCarFlacByMeta = async (songTitle, songArtist) => {
  if (!songTitle) return null;
  const cleanCoreTitle = songTitle.replace(/[\(（\[【《〈].*?[\)）\]】》〉]/g, '').trim() || songTitle;
  const cleanFirstArtist = (String(songArtist || '').split(/[\/&,，、]/)[0] || '').trim();

  // 1. 优先以 歌名 + 歌手 检索
  let sKw = cleanCoreTitle + (cleanFirstArtist ? (' ' + cleanFirstArtist) : '');
  const searchUrl = 'http://search.kuwo.cn/r.s?client=kt&all=' + encodeURIComponent(sKw) + '&pn=0&rn=8&uid=794764843&ver=kwplayer_ar_9.2.2.1&vipver=1&show_copyright_off=1&newsearch=1&ft=music&cluster=0&strategy=2012&encoding=utf8&rformat=json&vermerge=1&mobi=1';

  try {
    const { body } = await httpGet(searchUrl, { timeout: 2200 });
    const sData = typeof body === 'string' ? parseSafeJson(body) : body;
    const items = (sData && sData.abslist) ? sData.abslist : [];

    const candidates = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const itTitle = (it.SONGNAME || '').replace(/&nbsp;/g, ' ').trim();
      const itArtist = (it.ARTIST || '').replace(/&nbsp;/g, ' ').replace(/\\\\u0026/g, '&').trim();
      const itAlb = (it.ALBUM || '').replace(/&nbsp;/g, ' ').trim();

      // 过滤伴奏、片段、铃声等杂音（红线一）
      const isJunk = /(伴奏|铃声|片段|翻唱|伴唱|降调|加快|慢速|dj版)/i.test(itTitle) && !/(伴奏|铃声|片段|翻唱|伴唱|降调|加快|慢速|dj版)/i.test(songTitle);
      if (isJunk) continue;

      // 严格歌手强匹配，杜绝张冠李戴（红线一）
      if (cleanFirstArtist) {
        const tA = cleanFirstArtist.toLowerCase();
        const cA = itArtist.toLowerCase();
        const cAA = ((it.AARTIST || '')).toLowerCase();
        if (!cA.includes(tA) && !tA.includes(cA) && !cAA.includes(tA) && !tA.includes(cAA)) {
          continue;
        }
      }

      const mRid = it.MUSICRID ? String(it.MUSICRID).replace('MUSIC_', '') : '';
      if (!mRid) continue;

      const isLive = /(live|现场|演唱会)/i.test(itTitle + ' ' + itAlb) && !/(live|现场|演唱会)/i.test(songTitle);
      candidates.push({ rid: mRid, isLive, title: itTitle, artist: itArtist, album: itAlb });
    }

    // 录音棚原版绝对优先于现场版 (Web 端标准)
    candidates.sort((a, b) => (a.isLive === b.isLive ? 0 : a.isLive ? 1 : -1));

    for (let i = 0; i < Math.min(candidates.length, 3); i++) {
      const flacUrl = await fetchCarFlacStream(candidates[i].rid);
      if (flacUrl) {
        console.log('[CarFlac] Matched target:', songTitle, '-> rid:', candidates[i].rid);
        return flacUrl;
      }
    }
  } catch (e) {
    console.log('[CarFlac] Search error:', e.message);
  }

  return null;
};

// ── 4. 核心音频分发调度引擎 ──
const handleMusicUrl = async (songInfo, type, source) => {
  const src = source || (songInfo && songInfo.source) || '';
  const title = (songInfo && (songInfo.name || songInfo.songname || songInfo.title || songInfo.songmid)) || '';
  let artist = (songInfo && (songInfo.singer || songInfo.artist)) || '';
  if (typeof artist !== 'string' && songInfo && Array.isArray(songInfo.singers)) {
    artist = songInfo.singers.map(s => s.name || s).join(' / ');
  }

  console.log('[CarFlac] handleMusicUrl:', src, title, artist);

  // 1. 0ms 内存级缓存
  const cacheKey = 'car_flac_' + (title || '') + '_' + (artist || '');
  const hit = getCachedUrl(cacheKey);
  if (hit) {
    console.log('[CarFlac] Cache hit:', cacheKey);
    return hit;
  }

  // 2. 若有明确酷我 RID，直接直出车载 FLAC
  let directRid = '';
  if (src === 'kw') {
    directRid = String((songInfo && (songInfo.id || songInfo.songmid || songInfo.rid || ''))).replace('MUSIC_', '').replace('kw_', '');
  } else if (songInfo && (songInfo.kuwo_id || songInfo.kw_id)) {
    directRid = String(songInfo.kuwo_id || songInfo.kw_id).replace('MUSIC_', '').replace('kw_', '');
  }

  if (directRid) {
    const directUrl = await fetchCarFlacStream(directRid);
    if (directUrl) {
      setCachedUrl(cacheKey, directUrl);
      return directUrl;
    }
  }

  // 3. 针对 QQ 音乐 (src === 'tx')、酷狗、导入歌单等：走全网车载 FLAC 智能直解
  if (title) {
    const flacUrl = await resolveCarFlacByMeta(title, artist);
    if (flacUrl) {
      setCachedUrl(cacheKey, flacUrl);
      return flacUrl;
    }
  }

  throw new Error('车载无损 FLAC 解析未命中');
};

// ── 5. 歌词解析 ──
const handleLyric = (songInfo, source) => {
  const title = (songInfo && (songInfo.name || songInfo.songname || songInfo.title || songInfo.songmid)) || '';
  let artist = (songInfo && (songInfo.singer || songInfo.artist)) || '';
  return new Promise((resolve, reject) => {
    const targetUrl = "https://music.cjy.qzz.io/api/song/lyric?title=" + encodeURIComponent(title) + "&artist=" + encodeURIComponent(artist);
    httpGet(targetUrl, { timeout: 2500 })
      .then(({ body }) => {
        try {
          const data = typeof body === 'string' ? JSON.parse(body) : body;
          if (data && data.code === 200 && data.lyric) {
            resolve({
              lyric: data.lyric,
              tlyric: data.trans || ''
            });
          } else {
            reject(new Error('No lyric'));
          }
        } catch (e) {
          reject(e);
        }
      })
      .catch(reject);
  });
};

const apis = {
  kw: { musicUrl: handleMusicUrl, lyric: handleLyric },
  kg: { musicUrl: handleMusicUrl, lyric: handleLyric },
  tx: { musicUrl: handleMusicUrl, lyric: handleLyric },
  wy: { musicUrl: handleMusicUrl, lyric: handleLyric },
  mg: { musicUrl: handleMusicUrl, lyric: handleLyric }
};

on(EVENT_NAMES.request, ({ source, action, info }) => {
  switch (action) {
    case 'musicUrl':
      return apis[source].musicUrl(info.musicInfo, info.type, source);
    case 'lyric':
      return apis[source].lyric(info.musicInfo, source);
    default:
      return Promise.reject(new Error('action not support'));
  }
});

send(EVENT_NAMES.inited, {
  status: true,
  openDevTools: false,
  sources: {
    kw: {
      name: '酷我音乐 (车载FLAC无损版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    },
    kg: {
      name: '酷狗音乐 (车载FLAC无损版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    },
    tx: {
      name: '企鹅音乐 (车载FLAC无损版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    },
    wy: {
      name: '网易音乐 (车载FLAC无损版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    },
    mg: {
      name: '咪咕音乐 (车载FLAC无损版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    }
  }
});
`;

export default builtinSource;
