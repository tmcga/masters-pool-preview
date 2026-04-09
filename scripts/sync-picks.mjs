#!/usr/bin/env node

// Fetches the Google Sheet CSV and writes data/picks.json
// Mirrors the column-detection logic from index.html so parsing stays consistent.
// Zero dependencies — uses only Node built-ins.

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'data');
const OUT_FILE = join(OUT_DIR, 'picks.json');

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQpkhnMMTD0_ZiiJcfHJHEtACREl4c2Jk1rnROSZtdGUsAjY7Ejhz80fe9psVknBk-sx_tvz5q8LxTx/pub?gid=1017839321&single=true&output=csv';

// ── CSV parser (mirrors index.html parseCSV) ────────────
function parseCSV(txt) {
  const rows = [];
  let row = [], f = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i], n = txt[i + 1];
    if (q) {
      if (c === '"' && n === '"') { f += '"'; i++; }
      else if (c === '"') q = false;
      else f += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',') { row.push(f.trim()); f = ''; }
      else if (c === '\n' || (c === '\r' && n === '\n')) {
        row.push(f.trim()); rows.push(row); row = []; f = '';
        if (c === '\r') i++;
      } else f += c;
    }
  }
  if (f || row.length) { row.push(f.trim()); rows.push(row); }
  return rows;
}

// ── Sanitize (strip HTML tags from user input) ──────────
const sanitize = s => s.replace(/<[^>]*>/g, '').trim();

// ── Name normalization (mirrors index.html normName) ────
const normName = s =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// ── Main ────────────────────────────────────────────────
async function main() {
  const url = SHEET_CSV_URL + (SHEET_CSV_URL.includes('?') ? '&' : '?') + '_t=' + Date.now();

  console.log('[sync-picks] Fetching sheet…');
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    console.error(`[sync-picks] Sheet fetch failed: ${res.status}`);
    process.exit(1);
  }

  const text = await res.text();
  const rows = parseCSV(text);
  if (rows.length < 2) {
    console.error('[sync-picks] Sheet has fewer than 2 rows');
    process.exit(1);
  }

  const hdr = rows[0].map(h => h.toLowerCase());
  const iName = hdr.findIndex(h => h.includes('full name'));
  const iWinner = hdr.findIndex(h => h.includes('winner'));
  const iAlt = hdr.findIndex(h => h.includes('alternate'));
  const iPicks = hdr.findIndex(h => h.includes('picks 1') || h.includes('scoring golfers') || h.includes('pick 1 to'));

  if (iName < 0 || iWinner < 0) {
    console.error('[sync-picks] Could not detect columns:', hdr);
    process.exit(1);
  }

  const participants = rows.slice(1)
    .filter(r => r[iName] && r[iWinner])
    .map(r => {
      const name = sanitize(r[iName]);
      const winner = sanitize(r[iWinner]);
      const alternate = sanitize(r[iAlt] || '');

      const raw = iPicks >= 0 && r[iPicks] ? r[iPicks] : r.slice(iAlt + 1).filter(Boolean).join(',');
      const allPicks = raw.split(',').map(s => sanitize(s)).filter(Boolean);

      const seen = new Set();
      const picks = [];
      for (const g of allPicks) {
        const k = normName(g);
        if (seen.has(k)) {
          console.warn(`[sync-picks] Duplicate pick "${g}" for ${name}, skipping`);
        } else {
          seen.add(k);
          picks.push(g);
        }
      }
      return { name, winner, alternate, picks };
    })
    .filter(p => p.picks.length > 0);

  const output = {
    updated: new Date().toISOString(),
    participants,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n');
  console.log(`[sync-picks] Wrote ${participants.length} entries to ${OUT_FILE}`);
}

main().catch(err => {
  console.error('[sync-picks] Fatal:', err);
  process.exit(1);
});
