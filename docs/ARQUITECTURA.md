# Arquitectura del POS Cafetería PWA

## 1. Resumen
PWA offline-first para tablet de 10" en horizontal. Interfaz de 3 columnas (Master-Detail). Todos los datos viven en IndexedDB (Dexie.js). La arquitectura es **Clean Architecture + Component-Driven**, con Custom Hooks y React Context API; equivale al MVVM que tenía la versión Android (Kotlin).

## 2. Capas y regla de dependencia
```
components  →  hooks  →  domain/usecases  →  db/repositories  →  Dexie (IndexedDB)
                 ↑
              context
```
Las capas externas dependen de las internas, nunca al revés. `domain/` no importa React ni Dexie.

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Presentación | `src/components` | Renderizar y emitir eventos. Sin reglas de negocio. |
| Estado compartido | `src/context` | `CajaContext` (sesión de caja) y `ComandaContext` (comanda, mesa, tipo de pedido). |
| Lógica de presentación | `src/hooks` | Orquesta estado, casos de uso y repositorios para los componentes (rol de ViewModel). |
| Dominio | `src/domain` | Cálculos y reglas puras: `calcularTotales`, `calcularVuelto`, `confirmarVenta`, `abrirCaja`, `cerrarCajaZ`. |
| Datos | `src/db` | Esquema Dexie, datos iniciales y repositorios con transacciones atómicas. |
| Utilidades | `src/utils` | Constantes, formateadores, generador de código de venta. |

Equivalencias con la versión Android: View → componentes; ViewModel → custom hooks; LiveData/StateFlow → useState/useReducer + Context; UseCases → `domain/usecases`; Repository + Room DAO → `db/repositories`; Entities → stores de Dexie.

## 3. Estructura de carpetas
```text
poscafeteria-pwa/
├── .github/
│   └── copilot-instructions.md
├── docs/
│   ├── ARQUITECTURA.md
│   ├── REQUISITOS.md
│   ├── MODELO_DATOS.md
│   └── PROMPTS_POR_FASE.md
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   ├── icons/                     # icon-192.png, icon-512.png, icon-maskable-512.png
│   └── img/                       # imágenes WebP del menú y plano del local
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── serviceWorkerRegistration.js
│   ├── components/
│   │   ├── layout/    TopBar.jsx, MainLayout.jsx
│   │   ├── mesas/     MesasPanel.jsx, MesaCard.jsx
│   │   ├── catalogo/  CatalogoPanel.jsx, CategoriaTabs.jsx, ProductoCard.jsx
│   │   ├── comanda/   ComandaPanel.jsx, ComandaItem.jsx, TotalesResumen.jsx
│   │   ├── pago/      PagoPanel.jsx, TicketConfirmado.jsx
│   │   ├── historial/ HistorialPanel.jsx, HistorialItem.jsx
│   │   ├── modals/    AperturaCajaModal.jsx, CierreCajaZModal.jsx
│   │   └── ui/        Button.jsx, Modal.jsx, Overlay.jsx, Toast.jsx
│   ├── context/       CajaContext.jsx, ComandaContext.jsx
│   ├── hooks/         useComanda.js, useCaja.js, useMesas.js, useCatalogo.js, useHistorial.js, useOnlineStatus.js
│   ├── domain/
│   │   ├── models/
│   │   └── usecases/  calcularTotales.js, confirmarVenta.js, abrirCaja.js, cerrarCajaZ.js
│   ├── db/
│   │   ├── database.js
│   │   ├── seed.js
│   │   └── repositories/ cajaRepository.js, mesaRepository.js, productoRepository.js, ventaRepository.js
│   └── utils/         formatters.js, constants.js, generarCodigoVenta.js
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 4. Flujo de una venta
1. El cajero toca un producto en `CatalogoPanel` → `useComanda.agregarProducto`.
2. El reducer actualiza la comanda y `calcularTotales` recalcula Subtotal, IGV y Total.
3. `ComandaPanel` y `TotalesResumen` se renderizan con los nuevos valores.
4. "Confirmar y Cobrar" → `confirmarVenta` valida (comanda con ítems, mesa o "Para llevar", monto recibido >= total).
5. `ventaRepository` ejecuta una transacción Dexie: inserta pedido, detalle y pago, y actualiza la mesa.
6. Si todo se confirma, se muestra `TicketConfirmado` con el código `VEN-AAAA-XXXX`. Si falla, rollback y mensaje de error.

## 5. Estados de interfaz
`CARGANDO`, `CAJA_CERRADA`, `CAJA_ABIERTA`, `MESA_SELECCIONADA`, `COMANDA_VACIA`, `PROCESANDO_PAGO`, `PAGO_EXITOSO`, `ERROR`. Se modelan con `useReducer` y determinan qué se renderiza y qué controles quedan habilitados.

## 6. PWA y offline
- `public/manifest.json`: `display: "standalone"`, `orientation: "landscape"`, `theme_color: "#5C3A21"`, `background_color: "#F4F0EA"`, íconos 192, 512 y maskable.
- `public/service-worker.js`: precarga el app shell en `install`, limpia cachés antiguas en `activate`, estrategia cache-first para estáticos y respaldo a `index.html` en navegaciones sin conexión.
- `src/serviceWorkerRegistration.js`: registra el SW en el evento `load`. Funciona solo con HTTPS o `localhost`.
- Primer arranque con conexión para que se guarden los archivos con hash de `/assets`. Para un precaché completo se puede usar `vite-plugin-pwa`.
- Se solicita `navigator.storage.persist()` para que el navegador no elimine IndexedDB.

## 7. Diseño visual (Warm Café)
Tokens de Tailwind: `cafe` #5C3A21, `hueso` #F4F0EA, `arena` #EFEBE9, `exito` #2E7D32, `terracota` #C62828. Tipografía Inter local (`@fontsource/inter`). Layout 3 columnas con CSS Grid (`grid-cols-12`: 3 / 5 / 4 como punto de partida).

## 8. Rendimiento del catálogo
Imágenes WebP de unos 256×256 px, `loading="lazy"`, `decoding="async"`, `width` y `height`. `ProductoCard` con `React.memo`, filtro por categoría con `useMemo`, manejadores con `useCallback`.
