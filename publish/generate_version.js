const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const pkg = require('../package.json')

let desc = ''
try {
  desc = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim()
} catch (e) {}
if (!desc) desc = '版本更新 v' + pkg.version

const openlistUrl = process.env.OPENLIST_URL || 'https://pan.cjy.qzz.io'
const apkName = process.env.APK_NAME || 'lx-music-cjy-release.apk'

let history = []
try {
  const oldVer = JSON.parse(fs.readFileSync(path.join(__dirname, 'version.json'), 'utf-8'))
  if (Array.isArray(oldVer.history)) {
    history = oldVer.history
  }
  if (oldVer.version && oldVer.version !== pkg.version) {
    if (!history.length || history[0].version !== oldVer.version) {
      history.unshift({
        version: oldVer.version,
        desc: oldVer.desc || '',
      })
    }
  }
} catch (e) {}

const data = {
  version: pkg.version,
  desc,
  downloadUrl: 'https://pan.cjy.qzz.io/d/%E7%A7%BB%E5%8A%A8%E4%BA%91%E7%9B%98/apps/' + apkName,
  history,
}

fs.writeFileSync(path.join(__dirname, 'version.json'), JSON.stringify(data, null, 2), 'utf-8')
fs.writeFileSync('version.json', JSON.stringify(data, null, 2), 'utf-8')
console.log('version.json generated successfully:', data.version)
