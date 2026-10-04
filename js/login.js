// Página /login: se elige un jugador de la lista y se entra con la contraseña sunombre123 (igual para todos; por ahora sin registro).
// Si el login es correcto, guarda la sesión y manda al inicio.
const limpiar = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const slugDe = (j) => j.foto.replace(/\.[a-z0-9]+$/i, "");
const CONTRASENA = "sunombre123";

const form = document.querySelector("#login-form");
const lista = document.querySelector("#login-jugador");
const aviso = document.querySelector("#login-error");

lista.innerHTML = '<option value="">Elegí tu nombre…</option>' +
  [...JUGADORES].sort((a, b) => a.apodo.localeCompare(b.apodo, "es"))
    .map((j) => `<option value="${slugDe(j)}">${j.apodo} · ${j.nombre}</option>`).join("");

if (typeof SUPABASE === "undefined" || !SUPABASE) {
  form.querySelectorAll("select,input,button").forEach((e) => (e.disabled = true));
  aviso.textContent = "El ingreso todavía no está disponible en el sitio publicado.";
  aviso.classList.add("ver");
}

function error(texto) {
  aviso.textContent = texto; aviso.classList.add("ver");
  form.classList.remove("mal"); void form.offsetWidth; form.classList.add("mal");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  aviso.classList.remove("ver");
  const slug = lista.value, escrito = limpiar(document.querySelector("#login-clave").value);
  const j = JUGADORES.find((x) => slugDe(x) === slug);
  if (!j) return error("Elegí tu nombre de la lista.");

  if (escrito !== CONTRASENA) return error("Contraseña incorrecta.");

  const boton = form.querySelector("button");
  boton.disabled = true; boton.textContent = "Entrando…";
  try {
    const r = await fetch(`${SUPABASE.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE.key, "Content-Type": "application/json" },
      body: JSON.stringify({ email: `${slug}@escandalo.test`, password: CONTRASENA }),
      signal: AbortSignal.timeout(5000),
    });
    const datos = await r.json();
    if (!r.ok || !datos.access_token) throw new Error(datos.msg || datos.error_description || "HTTP " + r.status);
    try { localStorage.setItem("escandalo-sesion", JSON.stringify({ access_token: datos.access_token, refresh_token: datos.refresh_token,
      expires_at: datos.expires_at, jugador: slug, nombre: j.nombre })); } catch (err) {}
    location.href = "/";
  } catch (err) {
    console.warn("Login:", err.message);
    error("No se pudo entrar. ¿Está prendida la base?");
    boton.disabled = false; boton.textContent = "Entrar";
  }
});
