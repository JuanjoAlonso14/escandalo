// Animaciones al hacer scroll: cada bloque entra suave cuando aparece en pantalla.
// Los elementos de una misma grilla entran escalonados. Funciona también con lo que se dibuja después (galería, filtros).
(() => {
  const SEL = ".title, .sub, h3, .next, .pcard, .gitem, .tcard, .row, #train > div, .stats > div, .uniforms > *, .historia p, .presentacion, .cal, .filters, .join-box, .center .btn";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const io = new IntersectionObserver((entradas) => entradas.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    io.unobserve(el);
    el.classList.add("visto");
    // al terminar se limpian las clases, para que el hover de cada tarjeta responda normal
    setTimeout(() => { el.classList.remove("anim", "visto"); el.style.removeProperty("--i"); }, 1400);
  }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  function preparar(el) {
    if (el.classList.contains("anim") || el.closest(".lightbox, .boom")) return;
    if (el.parentElement?.closest(SEL)) return;          // si el contenedor ya se anima, no repetir adentro
    const hermanos = [...el.parentElement.children].filter((h) => h.matches(SEL));
    el.style.setProperty("--i", hermanos.indexOf(el) % 8);
    el.classList.add("anim");
    io.observe(el);
  }
  const buscar = (raiz) => {
    if (raiz.matches?.(SEL)) preparar(raiz);
    raiz.querySelectorAll?.(SEL).forEach(preparar);
  };

  buscar(document.body);
  new MutationObserver((cambios) => cambios.forEach((c) => c.addedNodes.forEach((n) => n.nodeType === 1 && buscar(n))))
    .observe(document.body, { childList: true, subtree: true });
})();
