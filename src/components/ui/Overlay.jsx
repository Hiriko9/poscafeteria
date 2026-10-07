function Overlay({ onClick, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 bg-cafe/50 ${className}`}
      onClick={onClick}
    />
  );
}

export default Overlay;