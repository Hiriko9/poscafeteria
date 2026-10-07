function obtenerCanalHex(hex, indice) {
  const canal = hex.length === 4
    ? `${hex[indice + 1]}${hex[indice + 1]}`
    : hex.slice(indice * 2 + 1, indice * 2 + 3);
  return Number.parseInt(canal, 16) / 255;
}

function luminanciaRelativa(color) {
  if (typeof color !== 'string' || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)) {
    throw new TypeError('El color debe estar en formato hexadecimal #RGB o #RRGGBB.');
  }

  const canales = [0, 1, 2].map((indice) => {
    const canal = obtenerCanalHex(color, indice);
    return canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });

  return canales[0] * 0.2126 + canales[1] * 0.7152 + canales[2] * 0.0722;
}

export function calcularContraste(colorA, colorB) {
  const luminanciaA = luminanciaRelativa(colorA);
  const luminanciaB = luminanciaRelativa(colorB);
  const clara = Math.max(luminanciaA, luminanciaB);
  const oscura = Math.min(luminanciaA, luminanciaB);
  return (clara + 0.05) / (oscura + 0.05);
}
