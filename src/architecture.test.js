import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcRoot = path.dirname(fileURLToPath(import.meta.url));

async function listarArchivos(directorio) {
  const entradas = await readdir(directorio, { withFileTypes: true });
  const grupos = await Promise.all(entradas.map(async (entrada) => {
    const ruta = path.join(directorio, entrada.name);
    return entrada.isDirectory() ? listarArchivos(ruta) : [ruta];
  }));
  return grupos.flat();
}

function esPrueba(ruta) {
  return /\.(?:test|spec)\.[jt]sx?$/.test(ruta);
}

function imports(ruta, contenido) {
  const coincidencias = [];
  const patron = /\b(?:from\s*|import\s*)['"]([^'"]+)['"]/g;
  let coincidencia = patron.exec(contenido);
  while (coincidencia) {
    coincidencias.push(coincidencia[1].replaceAll('\\', '/'));
    coincidencia = patron.exec(contenido);
  }
  return coincidencias.map((origen) => ({ ruta, origen }));
}

describe('reglas de arquitectura', () => {
  it('mantiene las dependencias permitidas entre capas', async () => {
    const archivos = (await listarArchivos(srcRoot))
      .filter((ruta) => /\.(?:js|jsx)$/.test(ruta) && !esPrueba(ruta));
    const fuentes = await Promise.all(archivos.map(async (ruta) => ({
      ruta: path.relative(srcRoot, ruta).replaceAll('\\', '/'),
      contenido: await readFile(ruta, 'utf8')
    })));
    const infracciones = [];

    for (const fuente of fuentes) {
      for (const dependencia of imports(fuente.ruta, fuente.contenido)) {
        const esImportDb = /(?:^|\/)db(?:\/|$)/.test(dependencia.origen);
        if (
          fuente.ruta.startsWith('domain/')
          && (dependencia.origen === 'react' || dependencia.origen === 'dexie' || esImportDb)
        ) {
          infracciones.push(`${fuente.ruta} importa ${dependencia.origen}`);
        }
        if (
          /^(?:components|hooks|context)\//.test(fuente.ruta)
          && (dependencia.origen === 'dexie' || /(?:^|\/)db\/database(?:\.js)?$/.test(dependencia.origen))
        ) {
          infracciones.push(`${fuente.ruta} importa ${dependencia.origen}`);
        }
      }
    }

    expect(infracciones).toEqual([]);
  });

  it('no calcula dinero con literales decimales fuera de src/db', async () => {
    const archivos = (await listarArchivos(srcRoot))
      .filter((ruta) =>
        /\.(?:js|jsx)$/.test(ruta)
        && !esPrueba(ruta)
        && !path.relative(srcRoot, ruta).startsWith(`db${path.sep}`)
      );
    const calculosMonetarios = [];
    const patron = /\b(?:monto|precio|subtotal|total|igv|efectivo|vuelto)\w*\s*(?:\*|\/|\+|-)\s*\d+\.\d+\b|\b\d+\.\d+\s*(?:\*|\/)\s*(?:monto|precio|subtotal|total|igv|efectivo|vuelto)\w*\b/gi;

    for (const ruta of archivos) {
      const contenido = await readFile(ruta, 'utf8');
      for (const coincidencia of contenido.matchAll(patron)) {
        calculosMonetarios.push(`${path.relative(srcRoot, ruta)}: ${coincidencia[0]}`);
      }
    }

    expect(calculosMonetarios).toEqual([]);
  });
});
