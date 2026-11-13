import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../assets/traxio-ui.js', import.meta.url), 'utf8');

test('RotaMapa title and slogan are present in the visible shell', () => {
  assert.match(html, /<title>RotaMapa \| Sua rota com inteligência\.<\/title>/);
  assert.match(ui, /Entrar no RotaMapa/);
  assert.match(ui, /SUA ROTA<br>COM INTELIGÊNCIA\./);
});

test('approved raster lettering replaces the legacy logo without generic font reconstruction', () => {
  assert.match(ui, /assets\/rotamapa\/logo\.webp/);
  assert.doesNotMatch(ui, /substituição por RotaMapa pendente/);
  assert.doesNotMatch(ui, /assets\/visual-kit\/assets\/logo_dark_background\.png/);
  const manifest=JSON.parse(readFileSync(new URL('../assets/traxelo/approved/visual/manifest.json',import.meta.url),'utf8'));
  assert.equal(manifest.project,'Traxelo.IA');
});
