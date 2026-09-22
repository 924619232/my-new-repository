import Btn from './Btn'
import { usePlayerMusicInfo } from '@/store/player/hook'
import handleDownloadMusic from '@/core/music/downloadHelper'

export default () => {
  const musicInfo = usePlayerMusicInfo()
  const handleDownload = () => {
    if (musicInfo.id) {
      void handleDownloadMusic(musicInfo as any)
    }
  }

  return <Btn icon="download-2" onPress={handleDownload} />
}
