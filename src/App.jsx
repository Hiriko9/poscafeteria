function App() {
  return (
    <main className="grid h-screen min-h-0 grid-cols-12 grid-rows-[4rem_minmax(0,1fr)] overflow-hidden bg-hueso text-cafe">
      <header aria-label="Barra superior" className="col-span-12 bg-cafe" />
      <section
        aria-label="Mesas e historial"
        className="col-span-3 min-w-0 border-r border-arena"
      />
      <section
        aria-label="Catálogo"
        className="col-span-5 min-w-0 border-r border-arena"
      />
      <section
        aria-label="Comanda y pago"
        className="col-span-4 min-w-0"
      />
    </main>
  );
}

export default App;