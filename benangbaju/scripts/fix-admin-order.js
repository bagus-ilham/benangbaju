const fs = require('fs')
const file = 'src/modules/orders/admin-order.service.ts'
let content = fs.readFileSync(file, 'utf8')

content = content.replace(
  /import \{ insertAdminActivityLog \} from '@\/modules\/admin-logs\/admin-log\.repository'/,
  "import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'"
)
content = content.replace(/insertAdminActivityLog\(/g, 'adminLogRepository.insertAdminActivityLog(')

content = content.replace(
  /fail\('Gagal mengupdate pesanan', error\.message\)/g,
  "fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengupdate pesanan')"
)
content = content.replace(
  /fail\('Gagal mengupdate permintaan retur', error\.message\)/g,
  "fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengupdate permintaan retur')"
)
content = content.replace(
  /fail\('Gagal menyimpan nomor resi', error\.message\)/g,
  "fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menyimpan nomor resi')"
)

fs.writeFileSync(file, content, 'utf8')
console.log('Fixed admin-order.service.ts')
