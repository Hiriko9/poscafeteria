import { db } from '../database.js';

function validarMonto(monto, nombre) {
  if (!Number.isSafeInteger(monto) || monto < 0) {
    throw new TypeError(`${nombre} debe ser un entero no negativo en céntimos.`);
  }
}

export async function obtenerSesionAbierta() {
  return db.cajaSesion.where('estado').equals('ABIERTA').first();
}

export async function abrirCaja({ montoInicial, fechaApertura = new Date().toISOString() }) {
  validarMonto(montoInicial, 'El monto inicial');
  const sesion = { fechaApertura, montoInicial, estado: 'ABIERTA' };

  return db.transaction('rw', db.cajaSesion, async () => {
    const sesionExistente = await db.cajaSesion.where('estado').equals('ABIERTA').first();

    if (sesionExistente) {
      throw new Error('No se puede abrir otra caja mientras exista una sesión ABIERTA.');
    }

    const id = await db.cajaSesion.add(sesion);
    return { id, ...sesion };
  });
}

export async function cerrarCaja({
  montoCierreEfectivo,
  montoCierreTarjetas,
  fechaCierre = new Date().toISOString()
}) {
  validarMonto(montoCierreEfectivo, 'El monto de cierre en efectivo');
  validarMonto(montoCierreTarjetas, 'El monto de cierre en tarjetas');

  return db.transaction(
    'rw',
    db.cajaSesion,
    db.pedidos,
    db.pagos,
    async () => {
      const sesion = await db.cajaSesion.where('estado').equals('ABIERTA').first();

      if (!sesion) {
        throw new Error('No hay una sesión ABIERTA para cerrar.');
      }

      const pedidos = await db.pedidos.where('cajaSesionId').equals(sesion.id).toArray();
      const pedidoIds = pedidos.map(({ id }) => id);
      const pagos = pedidoIds.length
        ? await db.pagos.where('pedidoId').anyOf(pedidoIds).toArray()
        : [];
      const ventasEfectivo = pagos
        .filter(({ metodo }) => metodo === 'EFECTIVO')
        .reduce((total, pago) => total + pago.montoCobrado, 0);
      const efectivoEsperado = sesion.montoInicial + ventasEfectivo;
      const diferencia = montoCierreEfectivo - efectivoEsperado;

      const cierre = {
        fechaCierre,
        montoCierreEfectivo,
        montoCierreTarjetas,
        diferencia,
        estado: 'CERRADA'
      };

      await db.cajaSesion.update(sesion.id, cierre);
      return { ...sesion, ...cierre };
    }
  );
}