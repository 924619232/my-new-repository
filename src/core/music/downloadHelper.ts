import { getMusicUrl, getPicPath } from '@/core/music'
import downloadManager from '@/services/download/downloadManager'
import { toast } from '@/utils/tools'

export const handleDownloadMusic = async(musicInfo: LX.Music.MusicInfo | LX.Music.MusicInfoOnline) => {
  try {
    if (musicInfo.source === 'local') {
      toast('本地歌曲无需下载')
      return
    }
    toast(`已加入下载队列: ${musicInfo.name}`)
    await downloadManager.addBatch([musicInfo as LX.Music.MusicInfoOnline])
    global.app_event.showDownloadModal()
  } catch (err: any) {
    console.warn('Download error:', err)
    toast(`下载出错: ${err.message || '网络异常'}`)
  }
}

export default handleDownloadMusic
