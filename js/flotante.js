// Botón flotante de WhatsApp, en todas las páginas
(() => {
  if (typeof TEAM === "undefined") return;
  const a = document.createElement("a");
  a.className = "wa-flot";
  a.href = "https://wa.me/" + TEAM.whatsapp + "?text=" + encodeURIComponent("¡Hola Escándalo! Quiero saber más sobre el equipo.");
  a.target = "_blank";
  a.rel = "noopener";
  a.setAttribute("aria-label", "Escribinos por WhatsApp");
  a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5l1.3-4.2a8.5 8.5 0 1 1 3.1 3l-4.4 1.2z"/><path d="M9 8.6c.2-.6.8-.7 1.1-.4l.9 1.6c.1.3 0 .6-.2.8l-.5.5c.5 1.1 1.4 2 2.5 2.5l.5-.5c.2-.2.5-.3.8-.2l1.6.9c.3.3.2.9-.4 1.1-2.9.9-7.2-3.4-6.3-6.3z" fill="currentColor" stroke="none"/></svg><span>¿Dudas? Escribinos</span>`;
  document.body.appendChild(a);

  // Barra de progreso de lectura, arriba de todo
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
