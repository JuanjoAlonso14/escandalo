// Barra de progreso de lectura (arriba). El contacto del equipo es por mail, no por WhatsApp.
(() => {
  const barra = document.createElement("div");
  barra.className = "progreso";
  barra.setAttribute("aria-hidden", "true");
  document.body.prepend(barra);
  const medir = () => {
    const alto = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${alto > 0 ? Math.min(1, scrollY / alto) : 0})`;
  };
  addEventListener("scroll", medir, { passive: true });
  addEventListener("resize", medir);
  medir();
})();
