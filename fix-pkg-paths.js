import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing pkg paths in dist/index.js...');

const indexPath = 'dist/index.js';
if (!fs.existsSync(indexPath)) {
  console.error('❌ dist/index.js not found');
  process.exit(1);
}

let content = fs.readFileSync(indexPath, 'utf8');

// إصلاح مسارات الملفات الثابتة
content = content.replace(/process\.cwd\(\)/g, '__dirname');
content = content.replace(/import\.meta\.url/g, '`file://${__dirname}/index.js`');

// إصلاح مسارات الملفات العامة
content = content.replace(/dist\/public/g, 'client');
content = content.replace(/\.\/public/g, './client');

// إضافة متغير __dirname للـ ES modules
const dirnameFix = `
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

`;

content = dirnameFix + content;

fs.writeFileSync(indexPath, content);
console.log('✅ Fixed pkg paths in dist/index.js');