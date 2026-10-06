// Íconos propios (SVG) para no depender de los emojis, que se ven distinto en cada dispositivo.
// En los textos de js/data.js se pueden seguir usando emojis: conIconos() los cambia por el ícono al mostrarlos.
const ICONOS = {
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  trofeo: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4"/>',
  disco: '<ellipse cx="12" cy="12" rx="9.5" ry="4.2"/><ellipse cx="12" cy="12" rx="4.5" ry="1.8"/>',
  reloj: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  estrella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
  candado: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/>',
  descargar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  compartir: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
  ampliar: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  whatsapp: '<path d="M3.5 20.5l1.3-4.2a8.5 8.5 0 1 1 3.1 3l-4.4 1.2z"/><path d="M9 8.6c.2-.6.8-.7 1.1-.4l.9 1.6c.1.3 0 .6-.2.8l-.5.5c.5 1.1 1.4 2 2.5 2.5l.5-.5c.2-.2.5-.3.8-.2l1.6.9c.3.3.2.9-.4 1.1-2.9.9-7.2-3.4-6.3-6.3z" fill="currentColor" stroke="none"/>',
  usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  salir: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
  panel: '<rect x="3" y="3" width="7.5" height="9" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="5" rx="1.5"/><rect x="13.5" y="11" width="7.5" height="10" rx="1.5"/><rect x="3" y="15" width="7.5" height="6" rx="1.5"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  editar: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>',
  basura: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ojo: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  "ojo-off": '<path d="M3 3l18 18M10.5 10.6a2.5 2.5 0 0 0 3 3M7 7.2C5 8.6 3.5 10.5 2 12c0 0 3.5 7 10 7 1.7 0 3.2-.4 4.5-1M14.1 5.2A10 10 0 0 1 12 5c-6.5 0-10 7-10 7a18 18 0 0 0 3.2 3.8M9.9 4.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.2 2.9"/>',
  caja: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 11h18M12 7V4M8 15h2M14 15h2"/>',
};
const ico = (n) => `<svg class="ico ico-${n}" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n] || ""}</svg>`;
const EMOJI_ICONO = { "🏆": "trofeo", "📅": "calendario", "📍": "pin", "🥏": "disco", "⭐": "estrella", "⏱": "reloj" };
// Escape para meter texto de DB/admin en innerHTML (antes de insertar SVGs de íconos)
const escHtml = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const conIconos = (s) => escHtml(s).replace(/🏆|📅|📍|🥏|⭐|⏱️?/gu, (e) => ico(EMOJI_ICONO[e.replace("️", "")]));
const sinEmojis = (s) => String(s).replace(/🏆|📅|📍|🥏|⭐|⏱️?/gu, "").trim();
