import { describe, expect, it } from 'vitest';
import { crearDatosPrecache } from './precache.js';

describe('crearDatosPrecache', () => {
  it('incluye app shell, assets y fuentes, y excluye worker y mapas', () => {
    const resultado = crearDatosPrecache([
      'index.html',
      'assets/app.js',
      'assets/app.css',
      'assets/inter-latin.woff2',
      'service-worker.js',
      'assets/app.js.map'
    ]);

    expect(resultado.urls).toEqual([
      '/assets/app.css',
      '/assets/app.js',
      '/assets/inter-latin.woff2',
      '/index.html'
    ]);
    expect(resultado.urls).not.toContain('/service-worker.js');
    expect(resultado.urls.some((url) => url.endsWith('.map'))).toBe(false);
  });

  it('genera la misma versión para la misma lista ordenada y cambia si cambia la lista', () => {
    const primero = crearDatosPrecache(['index.html', 'assets/app.js']);
    const mismaLista = crearDatosPrecache(['assets/app.js', 'index.html']);
    const nuevaLista = crearDatosPrecache(['index.html', 'assets/app-v2.js']);

    expect(primero.version).toBe(mismaLista.version);
    expect(primero.version).not.toBe(nuevaLista.version);
  });
});
