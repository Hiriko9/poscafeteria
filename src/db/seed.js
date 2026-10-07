import { db } from './database.js';

const mesasIniciales = [
  { id: 0, numero: 0, nombre: 'Para llevar', capacidad: 0, estado: 'LIBRE', posX: 0, posY: 0 },
  { id: 1, numero: 1, capacidad: 2, estado: 'LIBRE', posX: 0, posY: 0 },
  { id: 2, numero: 2, capacidad: 2, estado: 'LIBRE', posX: 1, posY: 0 },
  { id: 3, numero: 3, capacidad: 2, estado: 'LIBRE', posX: 2, posY: 0 },
  { id: 4, numero: 4, capacidad: 4, estado: 'LIBRE', posX: 0, posY: 1 },
  { id: 5, numero: 5, capacidad: 4, estado: 'LIBRE', posX: 1, posY: 1 },
  { id: 6, numero: 6, capacidad: 4, estado: 'LIBRE', posX: 2, posY: 1 },
  { id: 7, numero: 7, capacidad: 4, estado: 'LIBRE', posX: 0, posY: 2 },
  { id: 8, numero: 8, capacidad: 4, estado: 'LIBRE', posX: 1, posY: 2 },
  { id: 9, numero: 9, capacidad: 4, estado: 'LIBRE', posX: 2, posY: 2 }
];

const productosIniciales = [
  { nombre: 'Latte', categoria: 'CALIENTES', precio: 1200, imagen: '/img/latte.webp', activo: true },
  { nombre: 'Americano', categoria: 'CALIENTES', precio: 900, imagen: '/img/americano.webp', activo: true },
  { nombre: 'Chocolate caliente', categoria: 'CALIENTES', precio: 1100, imagen: '/img/chocolate-caliente.webp', activo: true },
  { nombre: 'Limonada', categoria: 'FRIAS', precio: 800, imagen: '/img/limonada.webp', activo: true },
  { nombre: 'Cold brew', categoria: 'FRIAS', precio: 1000, imagen: '/img/cold-brew.webp', activo: true },
  { nombre: 'Frappé', categoria: 'FRIAS', precio: 1300, imagen: '/img/frappe.webp', activo: true },
  { nombre: 'Muffin', categoria: 'REPOSTERIA', precio: 850, imagen: '/img/muffin.webp', activo: true },
  { nombre: 'Croissant', categoria: 'REPOSTERIA', precio: 950, imagen: '/img/croissant.webp', activo: true },
  { nombre: 'Brownie', categoria: 'REPOSTERIA', precio: 900, imagen: '/img/brownie.webp', activo: true }
];

export async function seedDatabase() {
  return db.transaction('rw', db.mesas, db.productos, async () => {
    const cantidadProductos = await db.productos.count();

    if (cantidadProductos > 0) {
      return false;
    }

    const cantidadMesas = await db.mesas.count();

    if (cantidadMesas === 0) {
      await db.mesas.bulkAdd(mesasIniciales);
    }

    await db.productos.bulkAdd(productosIniciales);
    return true;
  });
}