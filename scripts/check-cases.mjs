import fs from 'fs';
import path from 'path';

function checkDir(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) checkDir(full);
    else if (/\.(tsx|ts)$/.test(f.name)) {
      const content = fs.readFileSync(full, 'utf8');
      const matches = content.matchAll(/from ['"](@\/[^'"]+)['"]/g);
      for (const m of matches) {
        const importPath = m[1].replace('@/', 'apps/web/src/');
        const dirPart = path.dirname(importPath);
        const filePart = path.basename(importPath);
        if (fs.existsSync(dirPart)) {
          const files = fs.readdirSync(dirPart);
          const found = files.find(x => x.toLowerCase() === filePart.toLowerCase() || x.toLowerCase().startsWith(filePart.toLowerCase() + '.'));
          if (found && !found.startsWith(filePart)) {
            console.log(`CASE MISMATCH in ${full}: ${m[1]} vs disk file ${found}`);
          }
        } else {
          console.log(`DIR NOT FOUND for import ${m[1]} in ${full}`);
        }
      }
    }
  }
}

checkDir('apps/web/src');
console.log('Case check complete.');
