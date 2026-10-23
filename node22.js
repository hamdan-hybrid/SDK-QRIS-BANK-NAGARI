const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

// SDK wajib Node 22. Cari node 22 yang terpasang agar PM2 tetap jalan
// walaupun node bawaan komputer bukan v22. Urutan: QRIS_NODE, node yang sedang jalan, nvm, fnm, n, lalu node sistem.
function versionOf(bin) {
  try {
    return execFileSync(bin, ['--version'], { encoding: 'utf8', timeout: 5000 }).trim();
  } catch {
    return null;
  }
}

function newestIn(dir, pattern, binPath) {
  let names;
  try {
    names = fs.readdirSync(dir).filter((name) => pattern.test(name));
  } catch {
    return [];
  }
  const sorted = names.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  return sorted.map((name) => path.join(dir, name, binPath));
}

function findNode22() {
  const home = os.homedir();
  const nvmDir = process.env.NVM_DIR || path.join(home, '.nvm');
  const candidates = [
    process.env.QRIS_NODE,
    process.execPath,
    ...newestIn(path.join(nvmDir, 'versions', 'node'), /^v22\./, 'bin/node'),
    ...newestIn(path.join(home, '.local', 'share', 'fnm', 'node-versions'), /^v22\./, 'installation/bin/node'),
    ...newestIn('/usr/local/n/versions/node', /^22\./, 'bin/node'),
    '/usr/local/bin/node',
    '/usr/bin/node',
  ];
  for (const bin of candidates) {
    if (!bin || !fs.existsSync(bin)) continue;
    if (/^v22\./.test(versionOf(bin) || '')) return bin;
  }
  return null;
}

module.exports = { findNode22 };
