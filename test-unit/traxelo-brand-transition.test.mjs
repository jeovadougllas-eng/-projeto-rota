import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../assets/traxio-ui.js', import.meta.url), 'utf8');

test('Traxelo.IA title and slogan are present in the visible shell', () => {
  assert.match(html, /<title>Traxelo\.IA \| Sua rota com inteligência\.<\/title>/);
  assert.match(ui, /Entrar no Traxelo\.IA/);
  assert.match(ui, /SUA ROTA<br>COM INTELIGÊNCIA\./);
});

test('approved raster lettering replaces the legacy logo without generic font reconstruction', () => {
  assert.match(ui, /assets\/traxelo\/approved\/visual\/assets\/branding\/logo_horizontal_fundo_escuro\.png/);
  assert.doesNotMatch(ui, /substituição por Traxelo\.IA pendente/);
  assert.doesNotMatch(ui, /assets\/visual-kit\/assets\/logo_dark_background\.png/);
  const manifest=JSON.parse(readFileSync(new URL('../assets/traxelo/approved/visual/manifest.json',import.meta.url),'utf8'));
  assert.equal(manifest.project,'Traxelo.IA');
});
