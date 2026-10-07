import { useLayoutEffect, useRef } from 'react';
import Overlay from './Overlay.jsx';

const selectorEnfoque =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Modal({
  children,
  title,
  titleId,
  onClose,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  className = ''
}) {
  const dialogRef = useRef(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const focoAnterior = document.activeElement;
    dialog?.focus();

    function manejarTeclado(evento) {
      if (evento.key === 'Escape' && closeOnEscape) {
        evento.preventDefault();
        onClose?.();
        return;
      }

      if (evento.key !== 'Tab' || !dialog) return;

      const elementos = [...dialog.querySelectorAll(selectorEnfoque)].filter(
        (elemento) => elemento.getAttribute('aria-hidden') !== 'true'
      );
      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];

      if (!primero) {
        evento.preventDefault();
        dialog.focus();
      } else if (
        evento.shiftKey &&
        (document.activeElement === primero ||
          document.activeElement === dialog ||
          !dialog.contains(document.activeElement))
      ) {
        evento.preventDefault();
        ultimo.focus();
      } else if (
        !evento.shiftKey &&
        (document.activeElement === ultimo ||
          document.activeElement === dialog ||
          !dialog.contains(document.activeElement))
      ) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', manejarTeclado);
    return () => {
      document.removeEventListener('keydown', manejarTeclado);
      if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) {
        focoAnterior.focus();
      }
    };
  }, [closeOnEscape, onClose]);

  function manejarFondo(evento) {
    if (closeOnOutsideClick && !dialogRef.current?.contains(evento.target)) {
      onClose?.();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={manejarFondo}
      data-testid="modal-backdrop"
    >
      <Overlay />
      <section
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-hueso p-6 text-cafe shadow-2xl ${className}`}
        role="dialog"
        tabIndex={-1}
      >
        <h2 className="mb-4 text-xl font-semibold" id={titleId}>
          {title}
        </h2>
        {children}
      </section>
    </div>
  );
}

export default Modal;