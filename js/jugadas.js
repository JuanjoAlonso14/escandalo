// Página /jugadas: solo con sesión (por ahora placeholder).
(() => {
  const raiz = document.querySelector("#jugadas");
  if (!raiz) return;

  document.querySelector("#year").textContent = new Date().getFullYear();
  const burger = document.querySelector("#burger"), menu = document.querySelector("#menu");
  if (burger && menu) {
    burger.onclick = () => menu.classList.toggle("open");
    menu.addEventListener("click", () => menu.classList.remove("open"));
  }
  if (typeof TEAM !== "undefined") {
    const ig = document.querySelector("#ig"), mail = document.querySelector("#mail");
    if (ig) ig.href = TEAM.instagram;
    if (mail) mail.href = "mailto:" + TEAM.email;
  }

  (async () => {
    if (!(await Sesion.token())) { location.href = "/login"; return; }
    raiz.innerHTML = `
      <h1 class="title">Jugadas</h1>
      <p class="adm-vacio">Acá van a vivir las jugadas del equipo. Pronto.</p>`;
  })();
})();
