import { useCallback, useEffect, useState } from 'react';
import { listarHistorial } from '../db/repositories/ventaRepository.js';

export function useHistorial() {
  const [ventas, setVentas] = useState([]);
  const [estado, setEstado] = useState('CARGANDO');
  const [error, setError] = useState(null);

  const cargarHistorial = useCallback(async (lanzarError = true) => {
    setEstado('CARGANDO');
    setError(null);

    try {
      const resultado = await listarHistorial();
      setVentas(resultado);
      setEstado('LISTO');
      return resultado;
    } catch (errorCarga) {
      const mensaje = `No se pudo cargar el historial: ${errorCarga.message}`;
      setEstado('ERROR');
      setError(mensaje);
      if (lanzarError) {
        throw new Error(mensaje, { cause: errorCarga });
      }
      return [];
    }
  }, []);

  const refrescarHistorial = useCallback(() => cargarHistorial(), [cargarHistorial]);

  useEffect(() => {
    let activo = true;
    const actualizarTrasVenta = () => {
      void cargarHistorial(false);
    };

    listarHistorial()
      .then((resultado) => {
        if (!activo) return;
        setVentas(resultado);
        setEstado('LISTO');
      })
      .catch((errorCarga) => {
        if (!activo) return;
        setEstado('ERROR');
        setError(`No se pudo cargar el historial: ${errorCarga.message}`);
      });
    window.addEventListener('pos:venta-registrada', actualizarTrasVenta);

    return () => {
      activo = false;
      window.removeEventListener('pos:venta-registrada', actualizarTrasVenta);
    };
  }, [cargarHistorial]);

  return { ventas, estado, error, refrescarHistorial };
}