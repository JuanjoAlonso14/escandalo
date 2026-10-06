// Corre justo después del bloque de uniformes: si hay sesión, desbloquea antes de galeria.js.
(() => {
  if (!document.documentElement.dataset.cuenta) return;
  const w = document.getElementById("uni-wrap");
  if (!w) return;
  w.classList.remove("bloqueado");
  w.querySelectorAll("[data-src]").forEach((el) => {
    if (el.tagName === "VIDEO") { el.removeAttribute("poster"); el.preload = "metadata"; }
    el.src = el.dataset.src;
  });
})();
