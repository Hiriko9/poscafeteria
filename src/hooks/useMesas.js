import { useCallback, useEffect, useState } from 'react';
import { listarMesas } from '../db/repositories/mesaRepository.js';

export function useMesas() {
  const [mesas, setMesas] = useState([]);
  const [estado, setEstado] = useState('CARGANDO');
  const [error, setError] = useState(null);

  const cargarMesas = useCallback(async (lanzarError = true) => {
    setEstado('CARGANDO');
    setError(null);

    try {
      const resultado = await listarMesas();
      setMesas(resultado);
      setEstado('LISTO');
      return resultado;
    } catch (errorCarga) {
      const mensaje = `No se pudieron cargar las mesas: ${errorCarga.message}`;
      setEstado('ERROR');
      setError(mensaje);
      if (lanzarError) {
        throw new Error(mensaje, { cause: errorCarga });
      }
      return [];
    }
  }, []);

  const refrescarMesas = useCallback(() => cargarMesas(), [cargarMesas]);

  useEffect(() => {
    let activo = true;
    const actualizarTrasVenta = () => {
      void cargarMesas(false);
    };

    listarMesas()
      .then((resultado) => {
        if (!activo) return;
        setMesas(resultado);
        setEstado('LISTO');
      })
      .catch((errorCarga) => {
        if (!activo) return;
        setEstado('ERROR');
        setError(`No se pudieron cargar las mesas: ${errorCarga.message}`);
      });
    window.addEventListener('pos:venta-registrada', actualizarTrasVenta);

    return () => {
      activo = false;
      window.removeEventListener('pos:venta-registrada', actualizarTrasVenta);
    };
  }, [cargarMesas]);

  return { mesas, estado, error, refrescarMesas };
}