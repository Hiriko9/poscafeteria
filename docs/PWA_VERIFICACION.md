# Verificación manual de la PWA

1. Ejecuta `pnpm build` y `pnpm preview`, abre la URL local de preview en Chrome y espera a que cargue la aplicación.
2. Abre DevTools > **Application** > **Manifest**. Comprueba el nombre «Café POS», orientación horizontal, colores y los tres íconos. La sección debe identificar la aplicación como instalable.
3. En **Application** > **Service Workers**, comprueba que `/service-worker.js` esté activo y controlando la página. Al publicar otro build, confirma que aparece una actualización esperando; no se activa sola.
4. En **Application** > **Cache Storage**, comprueba que exista una caché `pos-cafe-*` con `index.html`, assets generados, manifest, íconos y fuentes locales.
5. En **Application** > **Service Workers**, marca **Offline**. Navega o recarga la app y comprueba que el shell se sirve desde la caché. Para comprobarlo sin el servidor: detén el preview con el terminal y recarga la misma página, manteniendo el navegador abierto y Offline habilitado.
6. Vuelve a conectar la red. En el menú de Chrome selecciona **Instalar Café POS** (o usa el botón de instalación que ofrece el navegador) y comprueba que abre como aplicación independiente.
7. Para empezar de cero, abre DevTools > **Application** > **Storage** > **Clear site data**. Esto elimina los datos locales de IndexedDB y las cachés; los productos seed se volverán a crear al iniciar de nuevo.

Las versiones recientes de Lighthouse ya no incluyen una categoría PWA. Verifica instalación, caché y comportamiento offline desde DevTools > Application.
