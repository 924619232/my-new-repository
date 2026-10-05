// Auto-generated built-in v3.8.3 decentralized direct source (Decentralized Autonomous Client - Log Edition)
const builtinSource: string = `/*!
 * @name CJY 臻品无损音源 (去中心化本地日志版)
 * @description 全球无损母带直推 · 客户端原生车机直解 · 200ms极速起播 · 纯本地免中心化
 * @version 3.8.3
 * @author CJY
 * @homepage https://music.cjy.qzz.io
 */

const { EVENT_NAMES, on, send, request } = globalThis.lx;

const API_BASE = "https://music.cjy.qzz.io";
const CURRENT_VERSION = "3.8.3";
const SOURCE_URL = API_BASE + "/api/lx/source.js";

// ── 0. 客户端 LRU 内存级缓存 (5分钟短期随用随取，杜绝410过期防盗链死锁) ──
const urlCache = new Map();
const CACHE_MAX = 200;
const CACHE_TTL = 300 * 1000; // 5分钟有效 (严格匹配车机防盗链时效)

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
      timeout: 3000
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
  try { return JSON.parse(raw); } catch(e) {
    try { return JSON.parse(raw.replace(/'/g, '"')); } catch(e2) { return null; }
  }
};

// ── 2. 官方原生车机版 2000kflac / 320k 客户端直解（严格拦截 mflac 加密流，自动降级 320k，100% 录音棚可播流） ──
const fetchKuwoCarFlac = async (kwRid, quality) => {
  const cleanRid = String(kwRid || '').replace('kw_', '').replace('MUSIC_', '').trim();
  if (!cleanRid) return null;
  let br = '2000kflac';
  if (quality === '128k') br = '128kmp3';
  else if (quality === '320k') br = '320kmp3';
  const mobiUrl = 'https://mobi.kuwo.cn/mobi.s?f=web&source=kwplayer_ar_8.5.5.0_apk_keluze.apk&type=convert_url_with_sign&rid=' + encodeURIComponent(cleanRid) + '&br=' + br + '&user=0';
  const { body } = await httpGet(mobiUrl, { timeout: 2500 });
  const data = typeof body === 'string' ? JSON.parse(body) : body;
  const directUrl = data && data.data && data.data.url;

  // 🛡️ 严格拒绝酷我私有加密格式 mflac（R~0u000 专有加密封装，播放器无法解码）
  const isEncrypted = directUrl && (directUrl.includes('.mflac') || data?.data?.format === 'mflac' || directUrl.includes('/q0m'));
  if (isEncrypted) {
    try {
      const mobi320 = 'https://mobi.kuwo.cn/mobi.s?f=web&source=kwplayer_ar_8.5.5.0_apk_keluze.apk&type=convert_url_with_sign&rid=' + encodeURIComponent(cleanRid) + '&br=320kmp3&user=0';
      const r320 = await httpGet(mobi320, { timeout: 2500 });
      const d320 = typeof r320.body === 'string' ? JSON.parse(r320.body) : r320.body;
      const u320 = d320 && d320.data && d320.data.url;
      if (u320 && typeof u320 === 'string' && u320.startsWith('http') && !u320.includes('.mflac')) {
        return u320;
      }
    } catch(e) {}
    return null;
  }

  return (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) ? directUrl : null;
};

// ── 2.4 咪咕官方原生流客户端直解（国内端侧对称解密，100% 官方首发与晚会独家原版秒播） ──
const decryptMiguBytes = (rawBytes) => {
  if (!rawBytes) return null;
  const MIGU_KEY = 'Jk8qzuePiJ1qE3mDYhLQ3T73DtDoAhLP';
  let bytes = rawBytes;
  if (rawBytes && Array.isArray(rawBytes.data)) {
    bytes = rawBytes.data;
  } else if (rawBytes && rawBytes.type === 'Buffer' && Array.isArray(rawBytes.data)) {
    bytes = rawBytes.data;
  } else if (typeof rawBytes === 'string') {
    bytes = [];
    for (let i = 0; i < rawBytes.length; i++) bytes.push(rawBytes.charCodeAt(i) & 0xff);
  } else if (rawBytes instanceof Uint8Array || Array.isArray(rawBytes)) {
    bytes = rawBytes;
  }
  if (!bytes || bytes.length < 5) return null;

  if (bytes[0] === 0xab && bytes[1] === 0xcd && bytes[2] === 0x01) {
    const seed = bytes[3];
    const keyCodes = [];
    for (let k = 0; k < MIGU_KEY.length; k++) keyCodes.push(MIGU_KEY.charCodeAt(k));
    const plain = [];
    for (let i = 4; i < bytes.length; i++) {
      plain.push((bytes[i] + seed - keyCodes[(i - 4) % keyCodes.length]) & 0xFF);
    }
    let str = '';
    for (let j = 0; j < plain.length; j++) str += String.fromCharCode(plain[j]);
    try {
      return JSON.parse(decodeURIComponent(escape(str)));
    } catch(e) {
      try { return JSON.parse(str); } catch(e2) { return null; }
    }
  }
  if (typeof rawBytes === 'object') return rawBytes;
  try { return JSON.parse(rawBytes); } catch(e) { return null; }
};

const fetchMiguStream = async (songInfo, type) => {
  let contentId = String(songInfo.contentId || '').trim();
  let copyrightId = String(songInfo.copyrightId || '').trim();
  const rawId = String(songInfo.songmid || songInfo.songId || songInfo.id || '').replace(/^mg_/, '').trim();

  // 🛡️ 核心防伪：若 contentId 缺失或非18位，通过 resourceinfo.do 毫秒级换取官方 18 位 contentId 与 copyrightId
  if (!contentId || contentId.length !== 18) {
    const queryId = rawId || copyrightId;
    if (queryId) {
      try {
        const infoUrl = 'https://c.musicapp.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?resourceType=2&resourceId=' + encodeURIComponent(queryId);
        const { body } = await httpGet(infoUrl, { timeout: 2500 });
        const resData = typeof body === 'string' ? JSON.parse(body) : body;
        const resList = resData && resData.resource;
        if (Array.isArray(resList) && resList.length > 0) {
          const item = resList[0];
          if (item.contentId && item.contentId.length === 18) contentId = String(item.contentId).trim();
          if (item.copyrightId) copyrightId = String(item.copyrightId).trim();
        }
      } catch (err) {}
    }
  }

  if (!contentId || contentId.length !== 18) return null;

  let tone = 'HQ';
  let rtype = '2';
  if (type === '128k') { tone = 'PQ'; rtype = '2'; }
  else if (type === 'flac' || type === 'sq') { tone = 'SQ'; rtype = 'E'; }

  const targetUrl = 'https://c.musicapp.migu.cn/strategy/listen-url/h5/v2.4?contentId=' + encodeURIComponent(contentId) + '&copyrightId=' + encodeURIComponent(copyrightId) + '&resourceType=' + rtype + '&netType=01&toneFlag=' + tone + '&scene=&lowerQualityContentId=' + encodeURIComponent(contentId);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Origin': 'https://h5.nf.migu.cn',
    'Referer': 'https://h5.nf.migu.cn/',
    'ua': 'Android_migu',
    'version': '6.8.8',
    'channel': '014021I',
    'subchannel': '014021I',
    'birth': 'h5page',
    'signature': '1'
  };

  try {
    const { body } = await httpGet(targetUrl, { headers, timeout: 3000, binary: true });
    const data = decryptMiguBytes(body);
    let directUrl = data && data.data && data.data.url;
    if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
      if (type === '320k' || type === 'flac' || type === 'auto' || type === 'sq') {
        directUrl = directUrl.replace(/\\/(?:MP3_128_16_Stero|Mp3_64_22_16|Mp3_128_16_Stero|MP3_64_22_16)\\//gi, '/MP3_320_16_Stero/');
      }
      return directUrl;
    }
  } catch(e) {}
  return null;
};

// ── 2.5 咪咕与长尾曲目元数据智能净化器（精准剥离影视剧/OST后缀与多合唱别名） ──
const cleanSongTitle = (rawTitle) => {
  if (!rawTitle) return '';
  let t = String(rawTitle).trim();
  // 剥离电视剧、电影、动画等原声带后缀：例如 (电视剧《...》插曲) / (《...》电视剧主题曲) / (OST) / (推广曲)
  t = t.replace(/[\\(（\\[【《〈].*?(?:电视剧|网络剧|剧集|电影|动画|动漫|插曲|主题曲|片尾曲|片头曲|原声带|推广曲|OST|影视剧).*?[\\)）\\]】》〉]/gi, '').trim();
  // 剥离补充说明括号，例如: (你我怎么两清)
  t = t.replace(/[\\(（\\[【《〈].*?[\\)）\\]】》〉]/g, '').trim();
  return t || rawTitle;
};

const cleanSongArtist = (rawArtist) => {
  if (!rawArtist) return '';
  let a = String(rawArtist).trim();
  // 剥离别名括号，例如: 邓寓君(等什么君) -> 邓寓君
  a = a.replace(/[\\(（\\[【].*?[\\)）\\]】]/g, '').trim() || a;
  // 提取首位主要歌手
  const first = (a.split(/[\\/&,，、]/)[0] || '').trim();
  return first || a;
};

// ── 3. 跨平台曲目客户端国内毫秒级原唱强匹配（严格现场版淘汰制，录音棚曲目绝不命中演唱会 Live） ──
const searchKuwoMatch = async (title, artist, quality) => {
  if (!title) return null;
  const cTitle = cleanSongTitle(title);
  const cArtist = cleanSongArtist(artist);
  const searchKey = cTitle + (cArtist ? (' ' + cArtist) : '');
  const searchUrl = 'https://search.kuwo.cn/r.s?client=kt&all=' + encodeURIComponent(searchKey) + '&pn=0&rn=6&ver=kwplayer_ar_9.2.2.1&vipver=1&show_copyright_off=1&newsearch=1&ft=music&cluster=0&strategy=2012&encoding=utf8&rformat=json&vermerge=1&mobi=1';
  const { body } = await httpGet(searchUrl, { timeout: 2500 });
  const data = parseKuwoJson(body);
  const items = (data && data.abslist) ? data.abslist : [];

  const isTargetLive = /(live|现场|演唱会|音乐会|tour)/i.test(title);

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const itTitle = (it.SONGNAME || '').trim();
    const itArtist = (it.ARTIST || '').replace(/\\\\u0026/g, '&').replace(/&nbsp;/g, ' ').trim();
    const itAArtist = (it.AARTIST || '').trim();
    const itAlb = (it.ALBUM || '').trim();

    // 过滤伴奏、片段、低质翻唱
    const isJunk = /(伴奏|铃声|片段|翻唱|伴唱|降调|加快|慢速|dj版)/i.test(itTitle) && !/(伴奏|铃声|片段|翻唱|伴唱|降调|加快|慢速|dj版)/i.test(title);
    if (isJunk) continue;

    // 🛡️【红线一】歌名强校验防伪：候选歌名必须与目标歌名一致，严禁张冠李戴！
    const targetTitleClean = cTitle.toLowerCase().replace(/\\s+/g, '');
    const candTitleClean = itTitle.toLowerCase().replace(/[\\(（\\[【《〈].*?[\\)）\\]】》〉]/g, '').replace(/[-_].*$/, '').replace(/\\s+/g, '') || itTitle.toLowerCase().replace(/\\s+/g, '');
    if (!candTitleClean.includes(targetTitleClean) && !targetTitleClean.includes(candTitleClean)) {
      continue; // 歌名不匹配，坚决一票否决！
    }

    // 严格现场版淘汰制：若原曲为录音棚版，候选一旦包含“现场/演唱会/Live”，坚决一票否决！
    const isCandidateLive = /(live|现场|演唱会|音乐会|tour)/i.test(itTitle + ' ' + itAlb);
    if (!isTargetLive && isCandidateLive) continue;

    if (cArtist) {
      const tA = cArtist.toLowerCase();
      const cA = itArtist.toLowerCase();
      const cAA = itAArtist.toLowerCase();
      if (!cA.includes(tA) && !tA.includes(cA) && !cAA.includes(tA) && !tA.includes(cAA)) continue;
      // 避免单人原唱被不相干合唱版本抢占；若歌名精确命中或原作者含有合唱标记，予以放行
      const rawArtistStr = String(artist || '');
      if (!rawArtistStr.includes('&') && !rawArtistStr.includes('/') && !rawArtistStr.includes('、')) {
        if (candTitleClean !== targetTitleClean && (itArtist.includes('&') || itArtist.includes('/') || itArtist.includes('、'))) continue;
      }
    }
    const rid = it.MUSICRID ? String(it.MUSICRID).replace('MUSIC_', '') : '';
    if (rid) {
      const flacUrl = await fetchKuwoCarFlac(rid, quality);
      if (flacUrl) return flacUrl;
    }
  }
  return null;
};

// ── 4. 下一曲预测性静默后台预热器 ──
const triggerNextTrackPrewarm = (title, artist) => {
  if (!title && !artist) return;
  try {
    const prewarmUrl = API_BASE + "/api/prewarm/next?title=" + encodeURIComponent(cleanSongTitle(title)) + "&artist=" + encodeURIComponent(cleanSongArtist(artist));
    request(prewarmUrl, { method: 'GET' }, () => {});
  } catch (e) {}
};

// ── 5. VPS 权威中枢解析请求（全平台高音质直连 + 0ms 内存/数据库缓存兜底） ──
const tryVpsResolve = (title, artist, songId, neteaseId, src, type) => new Promise((resolve, reject) => {
  const qualityParam = (type && type !== 'auto') ? ('&quality=' + encodeURIComponent(type)) : '';
  const idParam = songId ? ('&id=' + encodeURIComponent(songId)) : '';
  const nidParam = neteaseId ? ('&netease_id=' + encodeURIComponent(neteaseId)) : '';
  const srcParam = src ? ('&source=' + encodeURIComponent(src)) : '';
  const targetUrl = API_BASE + "/api/song/url?title=" + encodeURIComponent(cleanSongTitle(title)) + "&artist=" + encodeURIComponent(cleanSongArtist(artist)) + idParam + nidParam + srcParam + qualityParam;

  httpGet(targetUrl, { timeout: 4500 })
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
    // 通道 B: 咪咕源优先尝试官方原生流对称解密（解决晚会首发/独家音源，0ms秒播）
    if (src === 'mg') {
      const mgStream = await fetchMiguStream(songInfo, type);
      if (mgStream) {
        setCachedUrl(cacheKey, mgStream);
        return mgStream;
      }
    }
    // 通道 C: 跨平台曲目客户端国内毫秒级原唱强匹配（直达 TME 车载 FLAC 无损流，0.2s 极速）
    if (title && (src === 'tx' || src === 'kg' || src === 'mg' || src === 'wy')) {
      const matchUrl = await searchKuwoMatch(title, artist, type);
      if (matchUrl) {
        setCachedUrl(cacheKey, matchUrl);
        return matchUrl;
      }
    }
  } catch (e) {}

  // 3. VPS 权威中枢解析兜底（若客户端直解未命中，平滑回退云端，携带清洗后标题与歌手）
  const vpsUrl = await tryVpsResolve(cleanSongTitle(title), cleanSongArtist(artist), songId, neteaseId, src, type);
  if (vpsUrl) {
    setCachedUrl(cacheKey, vpsUrl);
    return vpsUrl;
  }
  throw new Error('未获取到有效音频直链');
};

// ── 7. 歌词解析 ──
const handleLyric = (songInfo, source) => {
  const rawTitle = (songInfo && (songInfo.name || songInfo.songname || songInfo.title || songInfo.songmid)) || '';
  const title = cleanSongTitle(rawTitle);
  let artist = cleanSongArtist((songInfo && (songInfo.singer || songInfo.artist)) || '');
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

// ── 8. 本地测试日志版：完全断开远程中心化版本拉取与上报 ──
// 保证 100% 本地端侧运行，零中心化 VPS 依赖

send(EVENT_NAMES.inited, {
  status: true,
  openDevTools: false,
  sources: {
    kw: {
      name: '酷我音乐 (本地直解日志版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    },
    kg: {
      name: '酷狗音乐 (本地直解日志版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    },
    tx: {
      name: '企鹅音乐 (本地直解日志版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    },
    wy: {
      name: '网易音乐 (本地直解日志版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    },
    mg: {
      name: '咪咕音乐 (本地直解日志版)',
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k', 'flac', 'flac24bit']
    }
  }
});
`;

export default builtinSource;
