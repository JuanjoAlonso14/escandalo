// Efecto 3D: las tarjetas se inclinan siguiendo el mouse, con un brillo que se mueve (solo con mouse, no en celular)
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const SEL = ".pcard, .tcard, .recurso, .t-stat";
  let actual = null;
  const soltar = (el) => {
    el.classList.remove("tilt");
    ["--rx", "--ry", "--gx", "--gy"].forEach((v) => el.style.removeProperty(v));
  };
  document.addEventListener("pointermove", (e) => {
    const el = e.target.closest ? e.target.closest(SEL) : null;
    if (actual && actual !== el) soltar(actual);
    actual = el;
    if (!el || el.classList.contains("anim")) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const fuerza = el.matches(".t-stat, .recurso") ? 6 : 12;
    el.style.setProperty("--ry", ((x - 0.5) * fuerza).toFixed(2) + "deg");
    el.style.setProperty("--rx", ((0.5 - y) * fuerza).toFixed(2) + "deg");
    el.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
    el.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
    el.classList.add("tilt");
  }, { passive: true });
  document.addEventListener("pointerleave", () => { if (actual) soltar(actual); actual = null; });
})();
