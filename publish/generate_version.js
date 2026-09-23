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
} catch (e) {}

const data = {
  version: pkg.version,
  desc,
  downloadUrl: 'https://music.cjy.qzz.io/apps/' + apkName,
  history,
}

fs.writeFileSync(path.join(__dirname, 'version.json'), JSON.stringify(data, null, 2), 'utf-8')
fs.writeFileSync('version.json', JSON.stringify(data, null, 2), 'utf-8')
console.log('version.json generated successfully:', data.version)
