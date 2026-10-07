const HASH_INICIAL = 2166136261;
const HASH_PRIMO = 16777619;

function hashLista(valor) {
  let hash = HASH_INICIAL;
  for (let indice = 0; indice < valor.length; indice += 1) {
    hash ^= valor.charCodeAt(indice);
    hash = Math.imul(hash, HASH_PRIMO);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function crearDatosPrecache(archivos) {
  const urls = [...new Set(archivos
    .map((archivo) => archivo.replaceAll('\\', '/').replace(/^\/+/, ''))
    .filter((archivo) => archivo && archivo !== 'service-worker.js' && !archivo.endsWith('.map'))
    .map((archivo) => `/${archivo}`))]
    .sort();

  return {
    urls,
    version: `pos-cafe-${hashLista(JSON.stringify(urls))}`
  };
}
