import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

const DIRECTORIO = path.resolve('public/icons');
const COLOR_FONDO = [0x5c, 0x3a, 0x21, 0xff];
const COLOR_TAZA = [0xf4, 0xf0, 0xea, 0xff];

function crc32(datos) {
  let crc = 0xffffffff;
  for (const byte of datos) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function crearChunk(tipo, datos) {
  const nombre = Buffer.from(tipo);
  const longitud = Buffer.alloc(4);
  longitud.writeUInt32BE(datos.length);
  const contenido = Buffer.concat([nombre, datos]);
  const suma = Buffer.alloc(4);
  suma.writeUInt32BE(crc32(contenido));
  return Buffer.concat([longitud, contenido, suma]);
}

function dentroDeTaza(x, y) {
  const cuerpo =
    y >= 0.39 &&
    y <= 0.68 &&
    x >= 0.29 + (y - 0.39) * 0.18 &&
    x <= 0.66 - (y - 0.39) * 0.12;
  const borde = y >= 0.36 && y <= 0.405 && x >= 0.27 && x <= 0.68;
  const asaDistancia = Math.hypot((x - 0.68) / 0.085, (y - 0.51) / 0.12);
  const asa = asaDistancia <= 1 && asaDistancia >= 0.52;
  const plato = y >= 0.72 && y <= 0.755 && x >= 0.25 && x <= 0.73;
  const vaporUno = x >= 0.38 && x <= 0.41 && y >= 0.17 && y <= 0.32;
  const vaporDos = x >= 0.49 && x <= 0.52 && y >= 0.13 && y <= 0.31;
  const vaporTres = x >= 0.59 && x <= 0.62 && y >= 0.18 && y <= 0.32;

  return cuerpo || borde || asa || plato || vaporUno || vaporDos || vaporTres;
}

function crearPng(tamano) {
  const filaBytes = tamano * 4 + 1;
  const pixeles = Buffer.alloc(filaBytes * tamano);
  for (let y = 0; y < tamano; y += 1) {
    const fila = y * filaBytes;
    pixeles[fila] = 0;
    for (let x = 0; x < tamano; x += 1) {
      const coordenadaX = (x + 0.5) / tamano;
      const coordenadaY = (y + 0.5) / tamano;
      const color = dentroDeTaza(coordenadaX, coordenadaY) ? COLOR_TAZA : COLOR_FONDO;
      const inicioPixel = fila + 1 + x * 4;
      pixeles.set(color, inicioPixel);
    }
  }

  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(tamano, 0);
  cabecera.writeUInt32BE(tamano, 4);
  cabecera[8] = 8;
  cabecera[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    crearChunk('IHDR', cabecera),
    crearChunk('IDAT', deflateSync(pixeles)),
    crearChunk('IEND', Buffer.alloc(0))
  ]);
}

await mkdir(DIRECTORIO, { recursive: true });
await Promise.all([
  writeFile(path.join(DIRECTORIO, 'icon-192.png'), crearPng(192)),
  writeFile(path.join(DIRECTORIO, 'icon-512.png'), crearPng(512)),
  writeFile(path.join(DIRECTORIO, 'icon-maskable-512.png'), crearPng(512))
]);
console.log('Íconos PWA creados en public/icons/.');
