import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { crearDatosPrecache } from './scripts/precache.js';

function precachePlugin() {
  let directorioSalida;

  return {
    name: 'pos-cafe-precache',
    apply: 'build',
    configResolved(config) {
      directorioSalida = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const archivos = [];
      const recorrer = async (directorio, relativo = '') => {
        for (const entrada of await readdir(directorio, { withFileTypes: true })) {
          const rutaRelativa = path.posix.join(relativo, entrada.name);
          const rutaAbsoluta = path.join(directorio, entrada.name);
          if (entrada.isDirectory()) await recorrer(rutaAbsoluta, rutaRelativa);
          else if (entrada.isFile()) archivos.push(rutaRelativa);
        }
      };

      await recorrer(directorioSalida);
      const { urls, version } = crearDatosPrecache(archivos);
      const rutaServiceWorker = path.join(directorioSalida, 'service-worker.js');
      const contenido = await readFile(rutaServiceWorker, 'utf8');
      const reemplazado = contenido
        .replaceAll('__PRECACHE_URLS__', JSON.stringify(urls))
        .replaceAll('__CACHE_VERSION__', JSON.stringify(version));

      if (reemplazado.includes('__PRECACHE_URLS__') || reemplazado.includes('__CACHE_VERSION__')) {
        throw new Error('No se pudieron reemplazar los marcadores del service worker.');
      }

      await writeFile(rutaServiceWorker, reemplazado);
    }
  };
}

export default defineConfig({
  plugins: [react(), precachePlugin()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/db/testSetup.js']
  }
});