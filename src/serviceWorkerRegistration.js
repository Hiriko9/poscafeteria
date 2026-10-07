let registroActual = null;
let recargaSolicitada = false;
let trabajadorNotificado = null;

function notificarActualizacion(registro, onUpdate) {
  if (
    registro.waiting &&
    registro.waiting !== trabajadorNotificado &&
    typeof onUpdate === 'function'
  ) {
    trabajadorNotificado = registro.waiting;
    onUpdate();
  }
}

export function registerServiceWorker({ onUpdate } = {}) {
  if (typeof navigator === 'undefined') return Promise.resolve(null);

  if (!import.meta.env.PROD) {
    if ('serviceWorker' in navigator) {
      return navigator.serviceWorker.getRegistrations().then((registros) =>
        Promise.all(registros.map((registro) => registro.unregister()))
      );
    }
    return Promise.resolve([]);
  }

  if (!('serviceWorker' in navigator)) return Promise.resolve(null);

  const registrar = () => navigator.serviceWorker
    .register('/service-worker.js')
    .then((registro) => {
      registroActual = registro;
      notificarActualizacion(registro, onUpdate);
      registro.addEventListener('updatefound', () => {
        const trabajador = registro.installing;
        if (!trabajador) return;

        trabajador.addEventListener('statechange', () => {
          if (trabajador.state === 'installed' && navigator.serviceWorker.controller) {
            notificarActualizacion(registro, onUpdate);
          }
        });
      });
      return registro;
    });

  if (document.readyState === 'complete') return registrar();
  return new Promise((resolve, reject) => {
    window.addEventListener('load', () => {
      registrar().then(resolve, reject);
    }, { once: true });
  });
}

export function aplicarActualizacionServiceWorker() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const trabajador = registroActual?.waiting;
  if (!trabajador || recargaSolicitada) return false;

  recargaSolicitada = true;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  }, { once: true });
  trabajador.postMessage({ type: 'SKIP_WAITING' });
  return true;
}