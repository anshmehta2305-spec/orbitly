import fs from 'fs';
import path from 'path';

// Phase 1 Static Analysis: Scan apps/web and packages/* for hardcoded color patterns
const ROOT_DIR = process.cwd();
const TARGET_DIRS = ['apps/web/src', 'packages'];
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build', '.git'];

const COLOR_PATTERNS = [
  { name: 'text-white/black', regex: /\btext-(white|black)\b/g },
  { name: 'bg-white/black', regex: /\bbg-(white|black)\b/g },
  { name: 'bg-gray/slate/zinc/neutral', regex: /\bbg-(gray|slate|zinc|neutral)-\d+\b/g },
  { name: 'text-gray/slate/zinc/neutral', regex: /\btext-(gray|slate|zinc|neutral)-\d+\b/g },
  { name: 'border-gray/slate/zinc/neutral', regex: /\bborder-(gray|slate|zinc|neutral)-\d+\b/g },
  { name: 'arbitrary-bg/text', regex: /\b(bg|text|border)-\[#?[a-zA-Z0-9_]+\]/g },
  { name: 'hex-color', regex: /#[0-9a-fA-F]{3,8}\b/g },
  { name: 'rgba-color', regex: /rgba?\([^)]+\)/g },
  { name: 'inline-style-color', regex: /style=\{\{[^}]*(color|background|backgroundColor|borderColor):[^}]*\}\}/g },
];

// Helper to determine if a hit is allowed (e.g. brand logos, static dark canvas, fixed-color primary button gradient)
function classifyHit(file, line, patternName, matchText) {
  const normFile = file.replace(/\\/g, '/');

  // Allowlist rules with explicit rationale:
  // 1. Brand logo or OAuth provider icons (Google logo, GitHub black badge)
  if (normFile.includes('Logo.tsx') || normFile.includes('SocialIcons') || normFile.includes('channel-')) {
    return { verdict: 'correct (brand asset/icon)', reason: 'Third-party brand color/icon asset' };
  }
  // 2. Button with fixed gradient where label must be white
  if (line.includes('from-indigo-600') || line.includes('bg-gradient-to-r') && line.includes('text-white')) {
    return { verdict: 'correct (fixed gradient text)', reason: 'Fixed gradient primary surface requires white text' };
  }
  // 3. Status badges with fixed semantic tokens
  if (line.includes('bg-rose-500 text-white') || line.includes('bg-emerald-500 text-white')) {
    return { verdict: 'correct (fixed status badge)', reason: 'High-contrast fixed semantic badge' };
  }
  // 4. CSS token definitions themselves (globals.css, tailwind.config)
  if (normFile.endsWith('globals.css') || normFile.endsWith('tailwind.config.ts')) {
    return { verdict: 'correct (design token definition)', reason: 'Theme token root definition' };
  }

  return { verdict: 'bug', reason: 'Hardcoded color on theme-varying surface' };
}

function scanDir(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE_DIRS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, fileList);
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function runStaticAudit() {
  console.log('--- Starting Phase 1 Static Audit ---');
  let allFiles = [];
  for (const target of TARGET_DIRS) {
    const targetPath = path.join(ROOT_DIR, target);
    if (fs.existsSync(targetPath)) {
      scanDir(targetPath, allFiles);
    }
  }

  const results = [];
  const folderCounts = {};
  let totalBugs = 0;
  let totalAllowed = 0;

  for (const file of allFiles) {
    const relFile = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
    const folder = relFile.split('/').slice(0, 3).join('/');
    folderCounts[folder] = folderCounts[folder] || { bugs: 0, allowed: 0, total: 0 };

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      for (const pat of COLOR_PATTERNS) {
        let match;
        const regex = new RegExp(pat.regex.source, pat.regex.flags);
        while ((match = regex.exec(lineText)) !== null) {
          const classification = classifyHit(relFile, lineText, pat.name, match[0]);
          const item = {
            file: relFile,
            line: lineNum,
            pattern: pat.name,
            match: match[0],
            context: lineText.trim().substring(0, 100),
            verdict: classification.verdict,
            reason: classification.reason,
          };
          results.push(item);

          if (classification.verdict === 'bug') {
            folderCounts[folder].bugs++;
            totalBugs++;
          } else {
            folderCounts[folder].allowed++;
            totalAllowed++;
          }
          folderCounts[folder].total++;
        }
      }
    });
  }

  return { results, folderCounts, totalBugs, totalAllowed, totalHits: results.length };
}

if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1].endsWith('phase1-audit.mjs')) {
  const audit = runStaticAudit();
  console.log(`Total Scanned Hits: ${audit.totalHits}`);
  console.log(`Total Color Bugs (un-tokenized): ${audit.totalBugs}`);
  console.log(`Total Allowed Exceptions: ${audit.totalAllowed}`);
  console.log('\n--- Count Per Folder ---');
  console.table(audit.folderCounts);
  
  fs.writeFileSync('audit-static-results.json', JSON.stringify(audit, null, 2));
  console.log('Saved static results to audit-static-results.json');
}
