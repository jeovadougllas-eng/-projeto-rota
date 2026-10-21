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

test('legacy logo raster is explicitly marked pending replacement', () => {
  assert.match(ui, /substituição por Traxelo\.IA pendente/);
  assert.match(ui, /assets\/visual-kit\/assets\/logo_dark_background\.png/);
});
