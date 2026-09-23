// Auto-generated built-in v3.5.1 domestic direct source
const builtinSource: string = `/*!
 * @name 官方无损直解音源 (国内秒播直解版)
 * @description 全球无损母带直推 · 客户端原生车机直解 · 200ms极速起播
 * @version 3.5.1
 * @author LX
 * @homepage https://music.cjy.qzz.io
 */

const { EVENT_NAMES, on, send, request } = globalThis.lx;

const API_BASE = "https://music.cjy.qzz.io";
const CURRENT_VERSION = "3.5.1";
const SOURCE_URL = API_BASE + "/api/lx/source.js";

// ── 0. 客户端 LRU 内存级缓存 (0ms 瞬间秒切/循环重播) ──
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

// ── 1. 通用 HTTP 异步请求封装 ──
const httpGet = (url, options) => new Promise((resolve, reject) => {
  try {
    const opts = Object.assign({
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 3500
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

const parseKuwoJson = (raw) => {
  if (typeof raw === 'object' && raw !== null) return raw;
  if (typeof raw !== 'string') return null;
  try { return JSON.parse(raw); } catch(e) {}
  try {
    return (new Function('return (' + raw + ')'))();
  } catch(e2) {
    try {
      return (new Function('return (' + raw.replace(/[\r\n\t]/g, ' ') + ')'))();
    } catch(e3) { return null; }
  }
};

// ── 2. 官方原生车机版 2000kflac / 320k 客户端直解（国内直通 200ms 秒出，100% 录音棚 FLAC） ──
const fetchKuwoCarFlac = async (kwRid, quality) => {
  const cleanRid = String(kwRid || '').replace('kw_', '').replace('MUSIC_', '').trim();
  if (!cleanRid) return null;
  let br = '2000kflac';
  if (quality === '128k') br = '128kmp3';
  else if (quality === '320k') br = '320kmp3';
  const mobiUrl = 'http://mobi.kuwo.cn/mobi.s?f=web&source=kwplayer_ar_8.5.5.0_apk_keluze.apk&type=convert_url_with_sign&rid=' + encodeURIComponent(cleanRid) + '&br=' + br + '&user=0';
  const { body } = await httpGet(mobiUrl, { timeout: 3000 });
  const data = typeof body === 'string' ? parseKuwoJson(body) : body;
  const directUrl = data && data.data && data.data.url;
  return (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) ? directUrl : null;
};

// ── 3. 跨平台曲目客户端国内毫秒级原唱强匹配（红线一：严格校验歌手、过滤杂音翻唱） ──
const doKuwoSearch = async (searchKey, cleanTitle, cleanFirstArtist, quality) => {
  const searchUrl = 'http://search.kuwo.cn/r.s?client=kt&all=' + encodeURIComponent(searchKey) + '&pn=0&rn=15&ver=kwplayer_ar_9.2.2.1&vipver=1&show_copyright_off=1&newsearch=1&ft=music&cluster=0&strategy=2012&encoding=utf8&rformat=json&vermerge=1&mobi=1';
  const { body } = await httpGet(searchUrl, { timeout: 3500 });
  const data = parseKuwoJson(body);
  const items = (data && data.abslist) ? data.abslist : [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const itTitle = (it.SONGNAME || '').replace(/&nbsp;/g, ' ').trim();
    const itArtist = (it.ARTIST || '').replace(/&nbsp;/g, ' ').replace(/\\u0026/g, '&').trim();
    const itAArtist = (it.AARTIST || '').replace(/&nbsp;/g, ' ').trim();
    const isJunk = /(伴奏|铃声|片段|翻唱|伴唱|降调|加快|慢速|dj版)/i.test(itTitle) && !/(伴奏|铃声|片段|翻唱|伴唱|降调|加快|慢速|dj版)/i.test(cleanTitle);
    if (isJunk) continue;
    if (cleanFirstArtist) {
      const tA = cleanFirstArtist.toLowerCase();
      const cA = itArtist.toLowerCase();
      const cAA = itAArtist.toLowerCase();
      if (!cA.includes(tA) && !tA.includes(cA) && !cAA.includes(tA) && !tA.includes(cAA)) continue;
    }
    const rid = it.MUSICRID ? String(it.MUSICRID).replace('MUSIC_', '') : '';
    if (rid) {
      const flacUrl = await fetchKuwoCarFlac(rid, quality);
      if (flacUrl) return flacUrl;
    }
  }
  return null;
};

const searchKuwoMatch = async (title, artist, quality) => {
  if (!title) return null;
  const cleanTitle = title.replace(/[\(\uff08\[\u3010\u300a\u3008].*?[\)\uff09\]\u3011\u300b\u3009]/g, '').trim() || title;
  const cleanFirstArtist = (String(artist || '').split(/[\/&,\uff0c\u3001]/)[0] || '').trim();
  let res = await doKuwoSearch(cleanTitle + (cleanFirstArtist ? (' ' + cleanFirstArtist) : ''), cleanTitle, cleanFirstArtist, quality);
  if (!res && cleanFirstArtist) {
    res = await doKuwoSearch(cleanTitle, cleanTitle, cleanFirstArtist, quality);
  }
  return res;
};

// ── 4. 下一曲预测性静默后台预热器 ──
const triggerNextTrackPrewarm = (title, artist) => {
  if (!title && !artist) return;
  try {
    const prewarmUrl = API_BASE + "/api/prewarm/next?title=" + encodeURIComponent(title) + "&artist=" + encodeURIComponent(artist);
    request(prewarmUrl, { method: 'GET' }, () => {});
  } catch (e) {}
};

// ── 5. VPS 权威中枢解析请求（全平台高音质直连 + 0ms 内存/数据库缓存兜底） ──
const tryVpsResolve = (title, artist, songId, neteaseId, src, type) => new Promise((resolve, reject) => {
  const qualityParam = (type && type !== 'auto') ? ('&quality=' + encodeURIComponent(type)) : '';
  const idParam = songId ? ('&id=' + encodeURIComponent(songId)) : '';
  const nidParam = neteaseId ? ('&netease_id=' + encodeURIComponent(neteaseId)) : '';
  const srcParam = src ? ('&source=' + encodeURIComponent(src)) : '';
  const targetUrl = API_BASE + "/api/song/url?title=" + encodeURIComponent(title) + "&artist=" + encodeURIComponent(artist) + idParam + nidParam + srcParam + qualityParam;

  httpGet(targetUrl, { timeout: 4000 })
    .then(({ body }) => {
      try {
        const data = typeof body === 'string' ? JSON.parse(body) : body;
        if (data && data.code === 200) {
          const streamUrl = data.url ? (data.url.startsWith('http') ? data.url : (API_BASE + data.url)) : (data.raw_url || data.direct_url || '');
          if (streamUrl) return resolve(streamUrl);
        }
        reject(new Error((data && data.msg) || '解析失败'));
      } catch (e) {
        reject(e);
      }
    })
    .catch(reject);
});

// ── 6. 核心音频地址分发引擎 ──
const handleMusicUrl = async (songInfo, type, source) => {
  const src = source || (songInfo && songInfo.source) || '';
  const title = (songInfo && (songInfo.name || songInfo.songname || songInfo.title || songInfo.songmid)) || '';
  let artist = (songInfo && (songInfo.singer || songInfo.artist)) || '';
  if (typeof artist !== 'string' && songInfo && Array.isArray(songInfo.singers)) {
    artist = songInfo.singers.map(s => s.name || s).join(' / ');
  }

  let songId = '';
  let neteaseId = '';
  let kwRid = '';

  if (src === 'wy') {
    neteaseId = String((songInfo && (songInfo.id || songInfo.songmid)) || '');
    songId = neteaseId ? ('wy_' + neteaseId) : '';
  } else if (src === 'kw') {
    kwRid = String((songInfo && (songInfo.id || songInfo.songmid || songInfo.rid || ''))).replace('MUSIC_', '');
    songId = kwRid ? ('kw_' + kwRid) : '';
  } else if (src === 'kg') {
    const kgHash = String((songInfo && (songInfo.hash || songInfo.fileHash || songInfo.songmid || songInfo.id || '')));
    songId = kgHash ? ('kg_' + kgHash) : '';
  } else if (src === 'tx') {
    const txMid = String((songInfo && (songInfo.songmid || songInfo.strMediaMid || songInfo.id || '')));
    songId = txMid ? ('tx_' + txMid) : '';
  } else if (src === 'mg') {
    const mgId = String((songInfo && (songInfo.copyrightId || songInfo.id || '')));
    songId = mgId ? ('mg_' + mgId) : '';
  } else {
    songId = (songInfo && (songInfo.songmid || songInfo.id || songInfo.mid || '')) || '';
    neteaseId = (songInfo && (songInfo.netease_id || '')) || '';
  }

  // 1. 客户端内存极速命中（0ms 瞬间秒起，重复点播/循环播放 0 延迟）
  const cacheKey = src + '_' + (songId || title) + '_' + artist + '_' + (type || 'auto');
  const hit = getCachedUrl(cacheKey);
  if (hit) return hit;

  triggerNextTrackPrewarm(title, artist);

  // 2. 客户端自主直解加速通道（国内端侧直接与音乐 CDN 握手，杜绝跨洋海缆延迟，0.2s~0.5s 秒播）
  try {
    // 通道 A: 酷我源直接调用车机 2000kflac 协议（200ms 原生出 FLAC）
    if (src === 'kw' && kwRid) {
      const flacUrl = await fetchKuwoCarFlac(kwRid, type);
      if (flacUrl) {
        setCachedUrl(cacheKey, flacUrl);
        return flacUrl;
      }
    }
    // 通道 B: 跨平台曲目客户端国内毫秒级原唱强匹配（300ms 出 FLAC）
    if (title && (src === 'tx' || src === 'kg' || src === 'mg' || src === 'wy')) {
      const matchUrl = await searchKuwoMatch(title, artist, type);
      if (matchUrl) {
        setCachedUrl(cacheKey, matchUrl);
        return matchUrl;
      }
    }
  } catch (e) {}

  // 3. VPS 权威中枢解析兜底（若客户端直解未命中，平滑回退云端）
  try {
    const vpsUrl = await tryVpsResolve(title, artist, songId, neteaseId, src, type);
    if (vpsUrl) {
      setCachedUrl(cacheKey, vpsUrl);
      return vpsUrl;
    }
  } catch (e) {}

  throw new Error('未获取到有效音频直链');
};

// ── 7. 歌词解析 ──
const handleLyric = (songInfo, source) => {
  const title = (songInfo && (songInfo.name || songInfo.songname || songInfo.title || songInfo.songmid)) || '';
  let artist = (songInfo && (songInfo.singer || songInfo.artist)) || '';
  return new Promise((resolve, reject) => {
    const targetUrl = API_BASE + "/api/song/lyric?title=" + encodeURIComponent(title) + "&artist=" + encodeURIComponent(artist);
    httpGet(targetUrl, { timeout: 3500 })
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

// ── 8. 原生更新推送与初始化 ──
let _hasAlerted = false;
const _parseVer = v => String(v).split('.').map(Number);
const _handleVerBody = (raw) => {
  if (_hasAlerted) return;
  try {
    const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!d || !d.version) return;
    const l = _parseVer(d.version), c = _parseVer(CURRENT_VERSION);
    for (let i = 0; i < 3; i++) {
      if ((l[i]||0) > (c[i]||0)) {
        _hasAlerted = true;
        send((EVENT_NAMES && EVENT_NAMES.updateAlert) || 'updateAlert', {
          log: d.log || ('发现新版本 v' + d.version + '，请更新音源以获得最佳体验。'),
          updateUrl: SOURCE_URL
        });
        break;
      }
      if ((l[i]||0) < (c[i]||0)) break;
    }
  } catch(e) {}
};

try {
  httpGet(API_BASE + "/api/lx/version", { timeout: 3000 })
    .then(({ body }) => _handleVerBody(body))
    .catch(() => {});
} catch(e) {}

send(EVENT_NAMES.inited, {
  status: true,
  openDevTools: false,
  sources: {
    kw: {
      name: '酷我音乐 (秒播直解版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    },
    kg: {
      name: '酷狗音乐 (秒播直解版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    },
    tx: {
      name: '企鹅音乐 (秒播直解版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    },
    wy: {
      name: '网易音乐 (秒播直解版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    },
    mg: {
      name: '咪咕音乐 (秒播直解版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    }
  }
});
`;

export default builtinSource;
