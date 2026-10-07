// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

const descriptorServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');

function instalarServiceWorkerMock(serviceWorker) {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: serviceWorker
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  if (descriptorServiceWorker) {
    Object.defineProperty(navigator, 'serviceWorker', descriptorServiceWorker);
  } else {
    delete navigator.serviceWorker;
  }
});

describe('registro del Service Worker', () => {
  it('no registra en desarrollo y desregistra los trabajadores anteriores', async () => {
    vi.stubEnv('PROD', false);
    const registro = { unregister: vi.fn().mockResolvedValue(true) };
    const registrar = vi.fn();
    instalarServiceWorkerMock({
      register: registrar,
      getRegistrations: vi.fn().mockResolvedValue([registro])
    });

    await (await import('./serviceWorkerRegistration.js?dev-test')).registerServiceWorker();

    expect(registro.unregister).toHaveBeenCalledOnce();
    expect(registrar).not.toHaveBeenCalled();
  });

  it('registra en producción y notifica una versión en espera', async () => {
    vi.stubEnv('PROD', true);
    const onUpdate = vi.fn();
    const registro = {
      waiting: { postMessage: vi.fn() },
      installing: null,
      addEventListener: vi.fn()
    };
    const registrar = vi.fn().mockResolvedValue(registro);
    instalarServiceWorkerMock({
      register: registrar,
      controller: {},
      addEventListener: vi.fn()
    });

    const { registerServiceWorker } = await import('./serviceWorkerRegistration.js?prod-test');
    await registerServiceWorker({ onUpdate });

    expect(registrar).toHaveBeenCalledWith('/service-worker.js');
    expect(onUpdate).toHaveBeenCalledOnce();
  });
});
