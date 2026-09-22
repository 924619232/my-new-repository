import { getMusicUrl, getPicPath } from '@/core/music'
import downloadManager from '@/services/download/downloadManager'
import { toast } from '@/utils/tools'

export const handleDownloadMusic = async(musicInfo: LX.Music.MusicInfo | LX.Music.MusicInfoOnline) => {
  try {
    toast(`开始下载: ${musicInfo.name} - ${musicInfo.singer}`)

    // 优先解析最高规格直链 (FLAC -> 320k)
    let url = ''
    try {
      url = await getMusicUrl({
        musicInfo: musicInfo as any,
        quality: 'flac',
        isRefresh: true,
      })
    } catch {
      url = await getMusicUrl({
        musicInfo: musicInfo as any,
        quality: '320k',
        isRefresh: true,
      })
    }

    if (!url) {
      toast(`获取 ${musicInfo.name} 下载直链失败`)
      return
    }

    let pic = ''
    try {
      pic = await getPicPath({ musicInfo: musicInfo as any })
    } catch {}

    await downloadManager.startDownload(
      {
        id: String(musicInfo.id),
        name: musicInfo.name,
        singer: musicInfo.singer,
        pic,
      },
      'flac',
      url,
      (progress) => {
        if (progress % 50 === 0 && progress > 0 && progress < 100) {
          toast(`下载中: ${musicInfo.name} (${progress}%)`)
        }
      }
    )

    toast(`下载成功: ${musicInfo.name}\n已保存至 /Music/CJYMusic/`)
  } catch (err: any) {
    console.warn('Download error:', err)
    toast(`下载出错: ${err.message || '网络异常'}`)
  }
}

export default handleDownloadMusic
