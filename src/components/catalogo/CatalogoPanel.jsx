import { useCallback, useMemo } from 'react';
import { useComandaContext } from '../../context/ComandaContext.jsx';
import { useCatalogo } from '../../hooks/useCatalogo.js';
import CategoriaTabs from './CategoriaTabs.jsx';
import ProductoCard from './ProductoCard.jsx';

export default function CatalogoPanel() {
  const { categoria, productos, estado, error, seleccionarCategoria } = useCatalogo();
  const { agregarProducto } = useComandaContext();
  const productosActivos = useMemo(
    () => productos.filter((producto) => producto.activo && producto.categoria === categoria),
    [categoria, productos]
  );
  const agregar = useCallback((producto) => agregarProducto(producto), [agregarProducto]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
      <CategoriaTabs categoria={categoria} onSelect={seleccionarCategoria} />
      <div
        aria-labelledby={`categoria-${categoria.toLowerCase()}`}
        className="min-h-0 flex-1"
        id="panel-catalogo"
        role="tabpanel"
      >
        {estado === 'CARGANDO' && (
          <p className="py-6 text-center" role="status">Cargando catálogo…</p>
        )}
        {estado === 'ERROR' && <p className="py-6 text-terracota" role="alert">{error}</p>}
        {estado === 'LISTO' && productosActivos.length === 0 && (
          <p className="py-6 text-center text-cafe/70" role="status">
            No hay productos disponibles en esta categoría.
          </p>
        )}
        {estado === 'LISTO' && productosActivos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {productosActivos.map((producto) => (
              <ProductoCard key={producto.id} onAgregar={agregar} producto={producto} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}