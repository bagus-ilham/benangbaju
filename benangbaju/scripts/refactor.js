const fs = require('fs')
const path = require('path')

function walk(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    file = path.resolve(dir, file)
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file))
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file)
      }
    }
  })
  return results
}

const files = walk('./src')
let changedCount = 0
files.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8')
  if (content.includes('insertAdminActivityLog')) {
    let newContent = content.replace(
      /import \{ insertAdminActivityLog \} from '@\/modules\/admin-logs\/admin-log\.repository'/g,
      "import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'"
    )
    newContent = newContent.replace(
      /insertAdminActivityLog\(/g,
      'adminLogRepository.insertAdminActivityLog('
    )
    if (content !== newContent) {
      fs.writeFileSync(f, newContent, 'utf8')
      changedCount++
    }
  }
})
console.log('Changed ' + changedCount + ' files.')
