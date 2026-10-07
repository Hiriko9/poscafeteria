# Prompts por fase para Copilot

Antes de cada fase, abre el chat de Copilot y adjunta los documentos indicados (por ejemplo `#file:docs/MODELO_DATOS.md`). Revisa y prueba cada fase antes de pasar a la siguiente.

## Fase 0: Proyecto base
Adjuntar: `#file:.github/copilot-instructions.md` `#file:docs/ARQUITECTURA.md`
> Crea la configuración inicial del proyecto con Vite (React), Tailwind CSS v3, Lucide React, Dexie y @fontsource/inter. Entrégame `package.json` (dependencias), `vite.config.js`, `tailwind.config.js` con los tokens Warm Café, `postcss.config.js`, `index.html`, `src/index.css`, `src/main.jsx` y `src/App.jsx` vacío con el layout de 3 columnas. Crea también la estructura de carpetas de ARQUITECTURA.md con archivos vacíos.

## Fase 1: Datos (db)
Adjuntar: `#file:docs/MODELO_DATOS.md`
> Implementa `src/db/database.js`, `src/db/seed.js` y los repositorios `cajaRepository`, `mesaRepository`, `productoRepository` y `ventaRepository` según MODELO_DATOS.md. `ventaRepository.registrarVenta` debe usar una transacción atómica. Incluye pruebas de Vitest para el rollback (simula un error dentro de la transacción).

## Fase 2: Dominio
Adjuntar: `#file:docs/REQUISITOS.md`
> Implementa en `src/domain/usecases` los archivos `calcularTotales.js` (con `calcularVuelto`), `confirmarVenta.js`, `abrirCaja.js` y `cerrarCajaZ.js`, y en `src/utils` `constants.js`, `formatters.js` y `generarCodigoVenta.js`. Usa montos en céntimos. Cada función con su archivo `.test.js` (incluye el ejemplo 3250 / 585 / 3835 / vuelto 1165).

## Fase 3: Hooks y contexto
Adjuntar: `#file:docs/ARQUITECTURA.md`
> Implementa `CajaContext`, `ComandaContext` y los hooks `useCaja`, `useComanda`, `useMesas`, `useCatalogo`, `useHistorial` y `useOnlineStatus`. `useComanda` usa `useReducer`, expone `totales` con `useMemo` y `puedeCobrar`. Pruebas con React Testing Library para `useComanda`.

## Fase 4: Caja
> Implementa `AperturaCajaModal`, `CierreCajaZModal`, `Overlay`, `Modal` y `TopBar`. Si no hay sesión de caja activa se bloquean las 3 columnas. El cierre Z calcula efectivo esperado y diferencia.

## Fase 5: Mesas y catálogo
> Implementa `MesasPanel`, `MesaCard`, `CatalogoPanel`, `CategoriaTabs` y `ProductoCard` (con `React.memo`, `loading="lazy"` y WebP). Estados de mesa Libre/Ocupada con los colores `exito` y `terracota`.

## Fase 6: Comanda, pago e historial
> Implementa `ComandaPanel`, `ComandaItem`, `TotalesResumen`, `PagoPanel`, `TicketConfirmado`, `HistorialPanel` e `HistorialItem`. El botón Cobrar se deshabilita según `puedeCobrar` y se bloquea durante `PROCESANDO_PAGO`.

## Fase 7: PWA y offline
> Crea `public/manifest.json`, `public/service-worker.js` y `src/serviceWorkerRegistration.js` según ARQUITECTURA.md, registra el SW en `main.jsx` y solicita `navigator.storage.persist()`. Comprueba instalabilidad, manifest y Service Workers en Chrome DevTools > Application. Las versiones recientes de Lighthouse ya no incluyen la categoría PWA.

## Fase 8: Pulido y pruebas
> Agrega un Error Boundary global, notificaciones toast y revisa accesibilidad y contraste. Revisa todo el proyecto contra `.github/copilot-instructions.md` y dime qué reglas no se cumplen.

## Consejos
- Si Copilot se sale de la arquitectura, responde: "Revisa `.github/copilot-instructions.md` y corrige respetando las capas".
- Pide siempre archivos completos con su ruta y no fragmentos sueltos.
- Haz commit al terminar cada fase para poder volver atrás.
