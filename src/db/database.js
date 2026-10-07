import Dexie from 'dexie';

export const db = new Dexie('PosCafeteriaDB');

db.version(1).stores({
  cajaSesion: '++id, estado, fechaApertura',
  mesas: '++id, numero, estado',
  productos: '++id, categoria, activo',
  pedidos: '++id, &codigoVenta, cajaSesionId, mesaId, estado, fechaHora',
  detallePedido: '++id, pedidoId, productoId',
  pagos: '++id, pedidoId, metodo'
});