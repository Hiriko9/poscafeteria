import { useCallback, useEffect, useState } from 'react';
import {
  abrirCaja as construirApertura,
  validarMontoInicial
} from '../domain/usecases/abrirCaja.js';
import { cerrarCajaZ as calcularCierre } from '../domain/usecases/cerrarCajaZ.js';
import {
  abrirCaja as persistirApertura,
  cerrarCaja as persistirCierre,
  obtenerResumenCierreCaja,
  obtenerSesionAbierta
} from '../db/repositories/cajaRepository.js';

export function useCaja() {
  const [sesion, setSesion] = useState(null);
  const [estado, setEstado] = useState('CARGANDO');
  const [error, setError] = useState(null);
  const [resumenCierre, setResumenCierre] = useState(null);

  const refrescarSesion = useCallback(async () => {
    setEstado('CARGANDO');
    setError(null);

    try {
      const sesionAbierta = (await obtenerSesionAbierta()) ?? null;
      setSesion(sesionAbierta);
      setEstado(sesionAbierta ? 'CAJA_ABIERTA' : 'CAJA_CERRADA');
      return sesionAbierta;
    } catch (errorCarga) {
      const mensaje = `No se pudo consultar la sesión de caja: ${errorCarga.message}`;
      setSesion(null);
      setEstado('ERROR');
      setError(mensaje);
      throw new Error(mensaje, { cause: errorCarga });
    }
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerSesionAbierta()
      .then((sesionAbierta) => {
        if (!activo) return;
        const actual = sesionAbierta ?? null;
        setSesion(actual);
        setEstado(actual ? 'CAJA_ABIERTA' : 'CAJA_CERRADA');
      })
      .catch((errorCarga) => {
        if (!activo) return;
        setEstado('ERROR');
        setError(`No se pudo consultar la sesión de caja: ${errorCarga.message}`);
      });

    return () => {
      activo = false;
    };
  }, []);

  const cargarResumenCierre = useCallback(async () => {
    if (!sesion?.id) {
      throw new Error('No hay una sesión de caja abierta para consultar el arqueo.');
    }

    try {
      const resumen = await obtenerResumenCierreCaja(sesion.id);
      setResumenCierre(resumen);
      setError(null);
      return resumen;
    } catch (errorResumen) {
      const mensaje = `No se pudo consultar el arqueo de caja: ${errorResumen.message}`;
      setError(mensaje);
      throw new Error(mensaje, { cause: errorResumen });
    }
  }, [sesion?.id]);

  const abrir = useCallback(async (montoInicial) => {
    setError(null);
    const validacion = validarMontoInicial(montoInicial);

    if (!validacion.valido) {
      setError(validacion.error);
      throw new TypeError(validacion.error);
    }

    try {
      const apertura = construirApertura({
        montoInicial,
        fechaApertura: new Date().toISOString()
      });
      const sesionAbierta = await persistirApertura(apertura);
      setSesion(sesionAbierta);
      setEstado('CAJA_ABIERTA');
      setResumenCierre(null);
      return sesionAbierta;
    } catch (errorApertura) {
      setError(`No se pudo abrir la caja: ${errorApertura.message}`);
      throw errorApertura;
    }
  }, []);

  const cerrar = useCallback(async ({ montoCierreEfectivo, montoCierreTarjetas = 0 }) => {
    setError(null);

    try {
      if (!sesion?.id) {
        throw new Error('No hay una sesión de caja abierta para cerrar.');
      }
      const resumen = await obtenerResumenCierreCaja(sesion.id);
      const cierreCalculado = calcularCierre({
        montoInicial: resumen.montoInicial,
        ventasEfectivo: resumen.ventasEfectivo,
        montoCierreEfectivo,
        montoCierreTarjetas
      });
      const sesionCerrada = await persistirCierre({ montoCierreEfectivo, montoCierreTarjetas });

      setSesion(null);
      setEstado('CAJA_CERRADA');
      setResumenCierre(null);
      return { ...sesionCerrada, ...cierreCalculado };
    } catch (errorCierre) {
      setError(`No se pudo cerrar la caja: ${errorCierre.message}`);
      throw errorCierre;
    }
  }, [sesion?.id]);

  return {
    sesion,
    estado,
    error,
    resumenCierre,
    refrescarSesion,
    cargarResumenCierre,
    abrirCaja: abrir,
    cerrarCajaZ: cerrar
  };
}