# Café POS

Aplicación web progresiva de punto de venta para cafeterías, diseñada para una tablet en orientación horizontal. Usa React y Vite; los datos operativos se guardan únicamente en IndexedDB del dispositivo mediante Dexie. No hay sincronización con un servidor.

## Requisitos

- Node.js compatible con Vite 6.
- pnpm mediante Corepack (`corepack enable`).

## Comandos

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm test
corepack pnpm build
corepack pnpm preview
```

## Estructura

- `src/components/`: interfaz organizada por función.
- `src/context/`: estado compartido de caja y comanda.
- `src/hooks/`: lógica de presentación.
- `src/domain/`: reglas y cálculos de negocio puros.
- `src/db/`: Dexie, seed y repositorios.
- `src/utils/`: constantes y utilidades.
- `public/`: manifest, service worker e íconos PWA.
- `docs/`: arquitectura, requisitos, datos y guías del proyecto.

## Verificación de la PWA

Sigue [docs/PWA_VERIFICACION.md](./docs/PWA_VERIFICACION.md) para revisar instalación, caché y modo offline en Chrome.

Los datos viven solo en IndexedDB de este dispositivo. Borrar los datos del sitio elimina las ventas guardadas localmente.
