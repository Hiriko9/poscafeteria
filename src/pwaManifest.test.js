import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('manifiesto PWA e íconos', () => {
  it('declara los campos instalables y PNG con dimensiones correctas', async () => {
    const manifest = JSON.parse(await readFile(path.join(raiz, 'public/manifest.json'), 'utf8'));
    const html = await readFile(path.join(raiz, 'index.html'), 'utf8');

    expect(manifest).toMatchObject({
      name: 'Café POS',
      short_name: 'Café POS',
      id: '/',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'landscape',
      lang: 'es-PE',
      background_color: '#F4F0EA',
      theme_color: '#5C3A21'
    });
    expect(manifest.icons).toHaveLength(3);

    for (const icono of manifest.icons) {
      const tamano = Number.parseInt(icono.sizes.split('x')[0], 10);
      const datos = await readFile(path.join(raiz, 'public', icono.src.replace(/^\//, '')));
      expect(datos.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(datos.readUInt32BE(16)).toBe(tamano);
      expect(datos.readUInt32BE(20)).toBe(tamano);
    }

    expect(manifest.icons.some(({ purpose }) => purpose?.split(/\s+/).includes('maskable'))).toBe(true);
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('<link rel="manifest" href="/manifest.json"');
    expect(html).toContain('<link rel="apple-touch-icon" href="/icons/icon-192.png"');
    expect(html).toContain('<meta name="theme-color" content="#5C3A21"');
  });
});
