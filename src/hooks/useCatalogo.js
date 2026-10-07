import { useCallback, useEffect, useMemo, useState } from 'react';
import { listarProductosActivosPorCategoria } from '../db/repositories/productoRepository.js';
import { CATEGORIAS_PRODUCTO } from '../utils/constants.js';

const categoriasValidas = new Set(Object.values(CATEGORIAS_PRODUCTO));

export function useCatalogo(categoriaInicial = CATEGORIAS_PRODUCTO.CALIENTES) {
  const [categoria, setCategoria] = useState(categoriaInicial);
  const [productosCargados, setProductosCargados] = useState([]);
  const [estado, setEstado] = useState('CARGANDO');
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    if (!categoriasValidas.has(categoria)) {
      setProductosCargados([]);
      setEstado('ERROR');
      setError('La categoría seleccionada no es válida.');
      return () => {
        activo = false;
      };
    }

    setEstado('CARGANDO');
    setError(null);
    listarProductosActivosPorCategoria(categoria)
      .then((productos) => {
        if (!activo) return;
        setProductosCargados(productos);
        setEstado('LISTO');
      })
      .catch((errorCarga) => {
        if (!activo) return;
        setProductosCargados([]);
        setEstado('ERROR');
        setError(`No se pudo cargar el catálogo: ${errorCarga.message}`);
      });

    return () => {
      activo = false;
    };
  }, [categoria]);

  const productos = useMemo(
    () => productosCargados.filter((producto) => producto.activo && producto.categoria === categoria),
    [productosCargados, categoria]
  );

  const seleccionarCategoria = useCallback((nuevaCategoria) => {
    setCategoria(nuevaCategoria);
  }, []);

  return { categoria, productos, estado, error, seleccionarCategoria };
}