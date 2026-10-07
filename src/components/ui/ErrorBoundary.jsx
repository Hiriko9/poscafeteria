import { Component } from 'react';

const mensajeError = 'Algo salió mal. Tus ventas guardadas están a salvo en este dispositivo.';
const mensajeRechazo = 'Ocurrió un problema inesperado. La aplicación sigue disponible.';

export default class ErrorBoundary extends Component {
  state = {
    error: null,
    claveContenido: 0,
    mostrarRechazo: false
  };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, informacion) {
    console.error('Error al renderizar Café POS:', error, informacion.componentStack);
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.manejarRechazo);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.manejarRechazo);
  }

  manejarRechazo = (evento) => {
    evento.preventDefault();
    console.error('Rechazo de promesa no controlado:', evento.reason);
    this.setState({ mostrarRechazo: true });
  };

  reintentar = () => {
    this.setState((estado) => ({
      error: null,
      claveContenido: estado.claveContenido + 1
    }));
  };

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-hueso p-6 text-cafe">
          <section aria-labelledby="error-app-titulo" className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl">
            <h1 className="mb-3 text-2xl font-bold" id="error-app-titulo">Café POS</h1>
            <p className="mb-6" role="alert">{mensajeError}</p>
            <div className="flex flex-wrap gap-3">
              <button
                className="min-h-11 rounded-lg bg-cafe px-4 font-semibold text-hueso"
                onClick={this.reintentar}
                type="button"
              >
                Reintentar
              </button>
              <button
                className="min-h-11 rounded-lg border border-cafe px-4 font-semibold text-cafe"
                onClick={() => window.location.reload()}
                type="button"
              >
                Recargar la aplicación
              </button>
            </div>
          </section>
        </main>
      );
    }

    return (
      <>
        {this.props.children && (
          <div key={this.state.claveContenido}>{this.props.children}</div>
        )}
        {this.state.mostrarRechazo && (
          <div className="fixed right-4 top-4 z-[70] flex max-w-sm items-center gap-3 rounded-lg bg-terracota px-4 py-2 text-hueso shadow-lg" role="alert">
            <span>{mensajeRechazo}</span>
            <button
              aria-label="Cerrar notificación"
              className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded hover:bg-white/10"
              onClick={() => this.setState({ mostrarRechazo: false })}
              type="button"
            >
              ×
            </button>
          </div>
        )}
      </>
    );
  }
}
