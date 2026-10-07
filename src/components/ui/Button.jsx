const variantes = {
  primaria: 'bg-cafe text-hueso hover:bg-cafe/90',
  secundaria: 'border border-cafe bg-hueso text-cafe hover:bg-arena'
};

function Button({
  children,
  variant = 'primaria',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cafe disabled:cursor-not-allowed disabled:opacity-50 ${variantes[variant] ?? variantes.primaria} ${className}`}
      disabled={disabled || loading}
      type={type}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
        />
      )}
      {children}
    </button>
  );
}

export default Button;