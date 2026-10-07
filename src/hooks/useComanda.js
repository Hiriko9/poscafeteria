import { useCallback, useMemo, useReducer, useRef } from 'react';
import { calcularTotales, calcularVuelto } from '../domain/usecases/calcularTotales.js';
import { construirPayloadVenta } from '../domain/usecases/confirmarVenta.js';
import { registrarVenta, siguienteSecuencia } from '../db/repositories/ventaRepository.js';
import { generarCodigoVenta } from '../utils/generarCodigoVenta.js';
import { MESA_VIRTUAL_ID, TIPOS_PEDIDO } from '../utils/constants.js';

const tiposPedidoValidos = new Set(Object.values(TIPOS_PEDIDO));

function esConflictoCodigoVenta(error) {
  return error?.name === 'ConstraintError' || error?.inner?.name === 'ConstraintError';
}

const estadoInicial = {
  items: [],
  mesaId: null,
  tipoPedido: TIPOS_PEDIDO.COMER_AQUI,
  estado: 'COMANDA_VACIA',
  ticket: null,
  error: null
};

function reducer(estado, accion) {
  switch (accion.tipo) {
    case 'AGREGAR_PRODUCTO': {
      const producto = accion.producto;
      const productoId = producto.id ?? producto.productoId;
      const existente = estado.items.find((item) => (item.id ?? item.productoId) === productoId);

      return {
        ...estado,
        items: existente
          ? estado.items.map((item) =>
              (item.id ?? item.productoId) === productoId
                ? { ...item, cantidad: item.cantidad + accion.cantidad }
                : item
            )
          : [...estado.items, { ...producto, cantidad: accion.cantidad, nota: producto.nota ?? '' }],
        estado: 'LISTA',
        ticket: null,
        error: null
      };
    }
    case 'CAMBIAR_CANTIDAD': {
      const items =
        accion.cantidad === 0
          ? estado.items.filter((item) => (item.id ?? item.productoId) !== accion.productoId)
          : estado.items.map((item) =>
              (item.id ?? item.productoId) === accion.productoId
                ? { ...item, cantidad: accion.cantidad }
                : item
            );

      return {
        ...estado,
        items,
        estado: items.length === 0 ? 'COMANDA_VACIA' : 'LISTA',
        ticket: null,
        error: null
      };
    }
    case 'CAMBIAR_NOTA':
      return {
        ...estado,
        items: estado.items.map((item) =>
          (item.id ?? item.productoId) === accion.productoId ? { ...item, nota: accion.nota } : item
        ),
        error: null
      };
    case 'SELECCIONAR_MESA':
      return {
        ...estado,
        mesaId: accion.mesaId,
        tipoPedido:
          accion.mesaId === MESA_VIRTUAL_ID ? TIPOS_PEDIDO.PARA_LLEVAR : TIPOS_PEDIDO.COMER_AQUI
      };
    case 'CAMBIAR_TIPO_PEDIDO':
      return accion.tipoPedido === TIPOS_PEDIDO.PARA_LLEVAR
        ? {
            ...estado,
            mesaId: MESA_VIRTUAL_ID,
            tipoPedido: TIPOS_PEDIDO.PARA_LLEVAR
          }
        : {
            ...estado,
            mesaId: null,
            tipoPedido: TIPOS_PEDIDO.COMER_AQUI
          };
    case 'PROCESANDO_PAGO':
      return { ...estado, estado: 'PROCESANDO_PAGO', error: null };
    case 'PAGO_EXITOSO':
      return { ...estado, estado: 'PAGO_EXITOSO', ticket: accion.ticket, error: null };
    case 'ERROR':
      return { ...estado, estado: 'ERROR', error: accion.error };
    case 'ADVERTENCIA':
      return { ...estado, error: accion.error };
    case 'LIMPIAR':
      return { ...estadoInicial };
    default:
      return estado;
  }
}

export function useComanda({ cajaSesionId, onVentaRegistrada } = {}) {
  const [state, dispatch] = useReducer(reducer, estadoInicial);
  const procesandoRef = useRef(false);
  const totales = useMemo(
    () => (state.items.length ? calcularTotales(state.items) : { subtotal: 0, igv: 0, total: 0 }),
    [state.items]
  );
  const mesaSeleccionada =
    (state.tipoPedido === TIPOS_PEDIDO.PARA_LLEVAR && state.mesaId === MESA_VIRTUAL_ID) ||
    (state.tipoPedido === TIPOS_PEDIDO.COMER_AQUI &&
      Number.isSafeInteger(state.mesaId) &&
      state.mesaId > MESA_VIRTUAL_ID);
  const puedeCobrar =
    state.items.length > 0 &&
    mesaSeleccionada &&
    state.estado !== 'PROCESANDO_PAGO' &&
    state.estado !== 'PAGO_EXITOSO';

  const agregarProducto = useCallback((producto, cantidad = 1) => {
    if (procesandoRef.current || state.estado === 'PAGO_EXITOSO') return;
    const id = producto?.id ?? producto?.productoId;
    const precio = producto?.precioUnitario ?? producto?.precio;

    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      !Number.isSafeInteger(precio) ||
      precio < 0 ||
      !Number.isSafeInteger(cantidad) ||
      cantidad <= 0
    ) {
      dispatch({
        tipo: 'ERROR',
        error: 'El producto debe tener un identificador, precio válido y cantidad entera mayor a 0.'
      });
      return;
    }

    dispatch({ tipo: 'AGREGAR_PRODUCTO', producto, cantidad });
  }, [state.estado]);
  const cambiarCantidad = useCallback((productoId, cantidad) => {
    if (procesandoRef.current || state.estado === 'PAGO_EXITOSO') return;
    if (!Number.isSafeInteger(cantidad) || cantidad < 0) {
      dispatch({ tipo: 'ERROR', error: 'La cantidad debe ser un entero no negativo.' });
      return;
    }

    dispatch({ tipo: 'CAMBIAR_CANTIDAD', productoId, cantidad });
  }, [state.estado]);
  const cambiarNota = useCallback((productoId, nota) => {
    if (procesandoRef.current || state.estado === 'PAGO_EXITOSO') return;
    dispatch({ tipo: 'CAMBIAR_NOTA', productoId, nota });
  }, [state.estado]);
  const seleccionarMesa = useCallback((mesa) => {
    if (procesandoRef.current || state.estado === 'PAGO_EXITOSO') return;
    dispatch({
      tipo: 'SELECCIONAR_MESA',
      mesaId: mesa && typeof mesa === 'object' ? mesa.id : mesa
    });
  }, [state.estado]);
  const cambiarTipoPedido = useCallback((tipoPedido) => {
    if (
      !procesandoRef.current &&
      state.estado !== 'PAGO_EXITOSO' &&
      tiposPedidoValidos.has(tipoPedido)
    ) {
      dispatch({ tipo: 'CAMBIAR_TIPO_PEDIDO', tipoPedido });
    }
  }, [state.estado]);
  const limpiar = useCallback(() => {
    if (!procesandoRef.current) dispatch({ tipo: 'LIMPIAR' });
  }, []);

  const confirmarPago = useCallback(
    async (metodoPago, montoRecibido) => {
      if (procesandoRef.current) {
        return { error: 'El pago ya se está procesando. Espera a que termine.' };
      }
      if (state.estado === 'PAGO_EXITOSO') {
        return { error: 'Esta comanda ya fue cobrada. Límpiala antes de iniciar otra venta.' };
      }

      procesandoRef.current = true;
      dispatch({ tipo: 'PROCESANDO_PAGO' });

      try {
        const ahora = new Date();
        const anio = ahora.getUTCFullYear();
        const secuencia = await siguienteSecuencia(anio);
        const codigoVenta = generarCodigoVenta(anio, secuencia);
        const fechaHora = ahora.toISOString();
        const datosVenta = {
          items: state.items,
          mesaId: state.mesaId,
          tipoPedido: state.tipoPedido,
          metodoPago,
          montoRecibido,
          cajaSesionId,
          fechaHora
        };
        let payload = construirPayloadVenta({ ...datosVenta, codigoVenta });
        let pedidoId;

        try {
          pedidoId = await registrarVenta(payload);
        } catch (errorRegistro) {
          if (!esConflictoCodigoVenta(errorRegistro)) {
            throw errorRegistro;
          }

          const nuevaSecuencia = await siguienteSecuencia(anio);
          const nuevoCodigoVenta = generarCodigoVenta(anio, nuevaSecuencia);
          payload = construirPayloadVenta({ ...datosVenta, codigoVenta: nuevoCodigoVenta });
          pedidoId = await registrarVenta(payload);
        }

        const ticket = {
          ...payload.pedido,
          id: pedidoId,
          detalles: payload.detalles,
          pago: payload.pago
        };

        dispatch({ tipo: 'PAGO_EXITOSO', ticket });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pos:venta-registrada', { detail: ticket }));
        }
        if (typeof onVentaRegistrada === 'function') {
          try {
            await onVentaRegistrada(ticket);
          } catch (errorActualizacion) {
            const mensaje = `La venta se registró, pero no se pudo actualizar la vista: ${errorActualizacion.message}`;
            dispatch({ tipo: 'ADVERTENCIA', error: mensaje });
            return { ticket, advertencia: mensaje };
          }
        }
        return { ticket };
      } catch (errorPago) {
        const mensaje = `No se pudo confirmar el pago: ${errorPago.message}`;
        dispatch({ tipo: 'ERROR', error: mensaje });
        return { error: mensaje };
      } finally {
        procesandoRef.current = false;
      }
    },
    [cajaSesionId, onVentaRegistrada, state.estado, state.items, state.mesaId, state.tipoPedido]
  );

  const vuelto = useCallback(
    (montoRecibido) => calcularVuelto(totales.total, montoRecibido),
    [totales.total]
  );

  return {
    ...state,
    state,
    totales,
    puedeCobrar,
    vuelto,
    agregarProducto,
    cambiarCantidad,
    cambiarNota,
    seleccionarMesa,
    cambiarTipoPedido,
    limpiar,
    confirmarPago
  };
}