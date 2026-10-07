# Instrucciones del proyecto: POS Cafetería PWA

Responde siempre en español. Este repositorio es un Sistema de Punto de Venta (POS) para cafeterías, desarrollado como Aplicación Web Progresiva (PWA) para tablet de 10" en horizontal. Antes de generar código de un módulo, revisa los documentos de la carpeta `docs/` (ARQUITECTURA.md, REQUISITOS.md, MODELO_DATOS.md).

## Stack (no cambiar sin pedirlo)
- React con Vite, JavaScript (archivos `.jsx` y `.js`).
- Gestor de paquetes: **pnpm** (nunca npm ni yarn). Usa `pnpm add`, `pnpm add -D`, `pnpm dev`, `pnpm build`. El lockfile es `pnpm-lock.yaml`.
- Tailwind CSS v3 y Lucide React para íconos.
- Dexie.js sobre IndexedDB como única fuente de verdad local. No hay backend ni llamadas a APIs externas.
- PWA con `public/manifest.json`, `public/service-worker.js` y `src/serviceWorkerRegistration.js`.
- Pruebas con Vitest y React Testing Library.
- No agregar librerías nuevas sin justificarlo y sin que yo lo apruebe.

## Arquitectura (Clean Architecture + Component-Driven)
Dependencias permitidas, siempre hacia adentro:
`components` → `hooks` → `domain/usecases` y `db/repositories` → `db/database.js` (Dexie)

- `src/components/`: solo interfaz. Renderizan datos y emiten eventos. Sin reglas de negocio ni acceso directo a Dexie.
- `src/context/`: estado compartido (`CajaContext`, `ComandaContext`) con Context API.
- `src/hooks/`: lógica de presentación (`useComanda`, `useCaja`, `useMesas`, `useCatalogo`, `useHistorial`, `useOnlineStatus`).
- `src/domain/`: JavaScript puro, sin importar React ni Dexie. Cálculos y reglas de negocio. Debe poder probarse con Vitest sin navegador.
- `src/db/`: `database.js` (esquema), `seed.js` y `repositories/` (único lugar donde se usa Dexie).
- `src/utils/`: constantes, formateadores y generador de código de venta.

## Reglas de negocio
- IGV = 18% (constante `IGV_RATE_PCT` en `src/utils/constants.js`). Total = Subtotal + IGV.
- Todos los montos se guardan y calculan como enteros en céntimos. Solo se convierten a soles (S/ con 2 decimales) al mostrarlos en pantalla.
- IGV = `Math.round((subtotal * 18) / 100)`. Vuelto = `max(0, recibido - total)`; el pago exige `recibido >= total`.
- La mesa virtual con `id = 0` representa "Para llevar". No se marca como ocupada.
- Sin sesión de caja activa (`cajaSesion.estado === 'ABIERTA'`) se muestra `AperturaCajaModal` con overlay y se bloquean las 3 columnas.
- Cada venta se asocia a la sesión de caja activa.
- Código de venta único con formato `VEN-AAAA-XXXX`.
- Registrar una venta (pedido, detalle, pago y estado de la mesa) y abrir o cerrar caja se hacen siempre con `db.transaction('rw', ...)`. Dentro de la transacción solo se esperan operaciones de Dexie.
- No guardar datos personales de clientes ni datos de tarjetas, solo el método de pago.

## Interfaz (Warm Café)
- Layout horizontal de 3 columnas (Master-Detail): col. 1 mesas / historial, col. 2 catálogo, col. 3 comanda, pago y ticket.
- Colores como tokens de Tailwind: `cafe` #5C3A21, `hueso` #F4F0EA, `arena` #EFEBE9, `exito` #2E7D32, `terracota` #C62828. No usar colores sueltos.
- Fuente Inter instalada con `@fontsource/inter` (nada de CDN, debe funcionar sin internet).
- Objetivos táctiles de unos 44×44 px mínimo. Estados visibles de carga, error y vacío.
- Imágenes del catálogo en WebP, con `loading="lazy"`, `decoding="async"`, `width` y `height`. `ProductoCard` usa `React.memo`; filtros con `useMemo`; manejadores con `useCallback`.

## Convenciones de código
- Componentes en PascalCase (`MesaCard.jsx`), hooks con prefijo `use`, funciones de dominio en camelCase.
- Un componente por archivo, props desestructuradas, sin lógica de negocio en el JSX.
- Manejo de errores con `try/catch` en hooks y repositorios; mostrar mensajes claros al cajero (toast). Incluir un Error Boundary global.
- Comentarios breves en español solo donde la lógica no sea obvia.
- Cada función de `domain/` debe venir con su prueba unitaria en un archivo `*.test.js` junto a ella.

## Forma de trabajo
- Entrega archivos completos, listos para pegar, indicando la ruta exacta de cada uno.
- Trabaja por fases (ver `docs/PROMPTS_POR_FASE.md`) y no generes módulos que no se hayan pedido.
- Si falta información o hay ambigüedad en una regla de negocio, pregúntame antes de asumir.

## Control de versiones
- El proyecto usa git. Al terminar cada fase: ejecuta las pruebas y pnpm build; si pasan, haz un commit local con el mensaje "Fase N: descripción".
- Antes de cada commit, muestra git status y revisa que no haya archivos inesperados.
- Nunca hagas git push, git reset --hard, git clean ni cambies la configuración global de git.

## Servidores y procesos
- Si inicias pnpm dev o pnpm preview para verificar algo, usa los puertos fijos 5173 (dev) y 4173 (preview), y al terminar detén SOLO el proceso que tú iniciaste (por su PID). Nunca dejes servidores abiertos ni uses taskkill /IM node.exe. Si un puerto está ocupado, no cambies de puerto: avísame.
