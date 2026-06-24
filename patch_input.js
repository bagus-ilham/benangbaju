const fs = require('fs');
const file = 'benangbaju/src/app/(customer)/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "import { Button, AuthLoading, PageContainer, PageHero } from '@/components/shared'",
  "import { Input } from '@/components/shared/Input'\nimport { Button, AuthLoading, PageContainer, PageHero } from '@/components/shared'"
);
fs.writeFileSync(file, content);
