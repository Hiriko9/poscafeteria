# Requisitos del POS Cafetería PWA

## Requisitos funcionales
| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| RF-01 | Apertura de caja | Al iniciar se verifica si hay sesión activa en `cajaSesion`. Si no, `AperturaCajaModal` sobre un overlay bloquea las 3 columnas hasta ingresar el monto inicial. | Must |
| RF-02 | Ventas por sesión | Cada pedido se asocia automáticamente a la sesión de caja activa. | Must |
| RF-03 | Arqueo y cierre Z | Desde la barra superior se abre `CierreCajaZModal`: desglose de efectivo y tarjetas, cálculo de la diferencia y bloqueo de la vista principal. | Must |
| RF-04 | Plano de mesas e historial | Columna 1 con pestañas Mesas (estados Libre / Ocupada) e Historial. | Must |
| RF-05 | Tipo de pedido | "Comer aquí" (mesa física) o "Para llevar" (mesa virtual id 0). | Must |
| RF-06 | Catálogo | Productos por categorías: Bebidas calientes, Bebidas frías, Repostería. | Must |
| RF-07 | Comanda activa | Agregar productos, cambiar cantidades y notas de preparación (ej. "Sin azúcar"). | Must |
| RF-08 | Cálculo de totales | Subtotal, IGV 18% y Total automáticos mediante `useComanda`. | Must |
| RF-09 | Pago y ticket | Método de pago (Efectivo, Yape, Tarjeta), cálculo de vuelto y ticket con código `VEN-AAAA-XXXX`. | Must |
| RF-10 | Historial de ventas | Lista cronológica de tickets; al seleccionar uno se muestra su detalle en la columna 3. | Should |

## Requisitos no funcionales
| ID | Atributo | Descripción |
|---|---|---|
| RNF-01 | Rendimiento | Procesar el cobro y emitir el ticket en 300 ms o menos. |
| RNF-02 | Mantenibilidad | Clean Architecture + Component-Driven, hooks y Context. |
| RNF-03 | Usabilidad | Tablet de 10" en horizontal, objetivos táctiles de unos 44 px, `orientation: landscape`. |
| RNF-04 | Disponibilidad offline | Operación 100% sin internet (Service Worker + IndexedDB). |
| RNF-05 | Integridad | Venta y actualización de mesa en una sola transacción con rollback. |
| RNF-06 | Seguridad y auditoría | Código de venta único e inmutable; no guardar datos de tarjetas ni datos personales de clientes. |
| RNF-07 | Instalabilidad | Manifest válido, Service Worker registrado y HTTPS o localhost. |

## Reglas de negocio
- Montos en céntimos enteros. Subtotal = suma de `precioUnitario × cantidad`.
- IGV = `Math.round((subtotal * 18) / 100)`. Total = Subtotal + IGV.
- Vuelto = `max(0, recibido - total)`; no se permite pagar con `recibido < total`.
- Ejemplo: 2 Latte × 1200 + 1 Muffin × 850 → Subtotal 3250, IGV 585, Total 3835; recibido 5000 → vuelto 1165.
- Los precios del catálogo no incluyen IGV.
- "Para llevar" usa la mesa virtual 0 y no la marca como ocupada.
- La mesa física pasa a OCUPADA al abrir su comanda y vuelve a LIBRE al confirmar el pago (comportamiento a confirmar con el cliente).
- Cierre Z: efectivo esperado = monto inicial + ventas en efectivo; diferencia = contado - esperado.

## Validaciones
| Regla | Dónde | Resultado |
|---|---|---|
| Sin sesión de caja activa | `useCaja` + `AperturaCajaModal` | Overlay y bloqueo de columnas |
| Comanda vacía o sin mesa / "Para llevar" | `useComanda.puedeCobrar` | Botón Cobrar deshabilitado |
| Cantidad <= 0, precio negativo o no numérico | Reducer y casos de uso | Se descarta o se elimina el ítem |
| Monto recibido < total | `PagoPanel` + `confirmarVenta` | Mensaje de monto insuficiente |
| Doble clic al cobrar | Estado `PROCESANDO_PAGO` | Botón bloqueado |
| Falla al registrar | Transacción Dexie | Rollback y mensaje de error |

## Fuera de alcance
Facturación electrónica SUNAT, backend o base de datos en la nube, pasarelas de pago reales, inventario y compras, app nativa, datos personales de clientes.
