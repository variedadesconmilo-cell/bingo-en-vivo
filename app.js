/* ============================================================
   app.js  —  LÓGICA COMPARTIDA
   ------------------------------------------------------------
   Contiene todo lo que usan las 3 pantallas:
     · Generación de cartones de bingo (75 bolas)
     · Patrones de victoria y cálculo de progreso
     · Validación de BINGO a partir de las bolas cantadas
     · Utilidades de UI: avisos, sonidos, confeti, vibración
   ============================================================ */

/* ============================================================
   0) CONSTANTES DEL JUEGO
   ============================================================ */
const BINGO_TOTAL_BOLAS = 75;                 // Bingo americano de 75 bolas
const LETRAS = ["B", "I", "N", "G", "O"];     // Columnas
const FREE_INDEX = 12;                        // Centro del cartón (fila 3, col 3)
const CELDAS_TOTALES = 25;

/* ============================================================
   1) UTILIDADES GENÉRICAS
   ============================================================ */

/** Selector corto */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/**
 * Normaliza a array cualquier valor que venga de Firebase.
 * Firebase convierte los arrays densos en arrays y los huecos en objetos.
 */
function aArray(valor) {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor.slice();
  return Object.keys(valor)
    .sort((a, b) => Number(a) - Number(b))
    .map(k => valor[k]);
}

/** Genera un id único corto para el jugador (persistente en localStorage) */
function idAleatorio(largo = 14) {
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < largo; i++) out += abc[Math.floor(Math.random() * abc.length)];
  return out;
}

/** Código de sala legible (sin caracteres ambiguos: 0/O, 1/I/L) */
function codigoSala(largo = 5) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < largo; i++) out += abc[Math.floor(Math.random() * abc.length)];
  return out;
}

/** Evita inyección de HTML al pintar nombres de jugadores */
function escaparHTML(txt) {
  return String(txt == null ? "" : txt).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/** Devuelve la letra (B/I/N/G/O) correspondiente a un número 1..75 */
function letraDe(n) {
  if (!n || n < 1 || n > 75) return "·";
  return LETRAS[Math.floor((n - 1) / 15)];
}

/** Índice de la celda -> fila / columna */
const filaDe   = i => Math.floor(i / 5);
const columnaDe = i => i % 5;

/** Vibración en móviles compatibles */
function vibrar(patron) {
  if (navigator.vibrate) { try { navigator.vibrate(patron); } catch (e) {} }
}

/**
 * Intenta interpretar un texto de premio como número.
 * Soporta "50.000" (latino) y "50,000" (anglo).
 */
function parsearMonto(txt) {
  if (txt == null) return null;
  const limpio = String(txt).replace(/[^\d.,]/g, "");
  if (!limpio) return null;
  let n;
  if (limpio.includes(",") && limpio.includes(".")) {
    n = limpio.lastIndexOf(",") > limpio.lastIndexOf(".")
      ? parseFloat(limpio.replace(/\./g, "").replace(",", "."))
      : parseFloat(limpio.replace(/,/g, ""));
  } else if (limpio.includes(",")) {
    n = parseFloat(limpio.replace(",", "."));
  } else {
    n = parseFloat(limpio.replace(/\./g, ""));
  }
  return isNaN(n) ? null : n;
}

/* ============================================================
   2) GENERACIÓN DE CARTONES (75 bolas, columnas B-I-N-G-O)
   ------------------------------------------------------------
   · Cada columna toma 5 números únicos de su rango de 15.
   · B: 1-15 | I: 16-30 | N: 31-45 | G: 46-60 | O: 61-75
   · El centro (índice 12) es la casilla GRATIS = 0
   ============================================================ */
function generarCarton() {
  const carton = new Array(CELDAS_TOTALES).fill(0);

  for (let c = 0; c < 5; c++) {
    const min = c * 15 + 1;
    const max = min + 14;

    const pool = [];
    for (let n = min; n <= max; n++) pool.push(n);

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const elegidos = pool.slice(0, 5).sort((a, b) => a - b);
    for (let f = 0; f < 5; f++) carton[f * 5 + c] = elegidos[f];
  }

  carton[FREE_INDEX] = 0;
  return carton;
}

/* ============================================================
   3) PATRONES DE VICTORIA
   ------------------------------------------------------------
   Para AGREGAR UN PATRÓN NUEVO solo añade una entrada aquí:
     · tipo "lineas"  -> gana cuando CUALQUIERA de las líneas
                         listadas se completa al 100%.
     · tipo "celdas"  -> gana cuando TODAS las celdas listadas
                         están marcadas.
   Los índices van de 0 (arriba-izq) a 24 (abajo-der).
   ============================================================ */

function _lineasDelBingo() {
  const lineas = [];
  for (let f = 0; f < 5; f++) {
    const l = []; for (let c = 0; c < 5; c++) l.push(f * 5 + c);
    lineas.push(l);
  }
  for (let c = 0; c < 5; c++) {
    const l = []; for (let f = 0; f < 5; f++) l.push(f * 5 + c);
    lineas.push(l);
  }
  lineas.push([0, 6, 12, 18, 24]);  // diagonal principal
  lineas.push([4, 8, 12, 16, 20]);  // diagonal inversa
  return lineas;
}

const _COL0   = [0, 5, 10, 15, 20];
const _FILA4  = [20, 21, 22, 23, 24];
const _BORDE  = [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24];
const _ESQUINAS = [0, 4, 20, 24];
const _EQUIS  = [0, 4, 6, 8, 12, 16, 18, 20, 24];
const _TODAS  = Array.from({ length: 25 }, (_, i) => i);

const PATRONES = {
  linea: {
    nombre: "Línea (fila, columna o diagonal)",
    corto: "Línea",
    tipo: "lineas",
    lineas: _lineasDelBingo(),
    icono: "➖"
  },
  cartonLleno: {
    nombre: "Cartón Lleno",
    corto: "Cartón Lleno",
    tipo: "celdas",
    celdas: _TODAS,
    icono: "🟦"
  },
  letraL: {
    nombre: "Letra L",
    corto: "Letra L",
    tipo: "celdas",
    celdas: Array.from(new Set([..._COL0, ..._FILA4])),
    icono: "🇱"
  },
  letraO: {
    nombre: "Letra O",
    corto: "Letra O",
    tipo: "celdas",
    celdas: _BORDE,
    icono: "⭕"
  },
  cuatroEsquinas: {
    nombre: "Cuatro Esquinas",
    corto: "4 Esquinas",
    tipo: "celdas",
    celdas: _ESQUINAS,
    icono: "🔲"
  },
  equis: {
    nombre: "Equis (X)",
    corto: "Equis",
    tipo: "celdas",
    celdas: _EQUIS,
    icono: "❌"
  }
};

/* ============================================================
   4) CÁLCULO DE PROGRESO Y VALIDACIÓN
   ============================================================ */

function estaMarcada(idx, marcas) {
  if (idx === FREE_INDEX) return true;
  return marcas.has(idx);
}

function calcularProgreso(carton, marcas, patronKey) {
  const patron = PATRONES[patronKey] || PATRONES.linea;

  if (patron.tipo === "lineas") {
    let mejor = 0;
    let completo = false;
    let mejorLinea = null;

    patron.lineas.forEach((linea, i) => {
      const total = linea.length;
      const hechas = linea.filter(idx => estaMarcada(idx, marcas)).length;
      const frac = hechas / total;
      if (hechas === total) completo = true;
      if (frac > mejor) { mejor = frac; mejorLinea = i; }
    });

    return {
      porcentaje: Math.round(mejor * 100),
      completo,
      detalle: { lineaMasAvanzada: mejorLinea }
    };
  }

  const total = patron.celdas.length;
  const hechas = patron.celdas.filter(idx => estaMarcada(idx, marcas)).length;
  return {
    porcentaje: Math.round((hechas / total) * 100),
    completo: hechas === total,
    detalle: { hechas, total }
  };
}

function progresoDesdeBolas(carton, bolas, patronKey) {
  const set = new Set(bolas.map(Number));
  const marcas = new Set();
  carton.forEach((num, idx) => {
    if (num !== 0 && set.has(Number(num))) marcas.add(idx);
  });
  return calcularProgreso(carton, marcas, patronKey);
}

/* ============================================================
   5) AVISOS (TOASTS)
   ============================================================ */
function aviso(mensaje, tipo = "info", ms = 3400) {
  let cont = document.getElementById("avisos");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "avisos";
    cont.className = "avisos";
    document.body.appendChild(cont);
  }
  const el = document.createElement("div");
  el.className = "aviso aviso-" + tipo;
  el.innerHTML = mensaje;
  cont.appendChild(el);
  setTimeout(() => {
    el.classList.add("saliendo");
    setTimeout(() => el.remove(), 420);
  }, ms);
}

/* ============================================================
   6) SONIDO (sintetizado con WebAudio, sin archivos externos)
   ============================================================ */
let _audioCtx = null;
let _silencio = false;

function setSilencio(v) { _silencio = !!v; }
function estaSilenciado() { return _silencio; }

function _tono(freq, dur, tipo = "sine", vol = 0.14, delay = 0) {
  if (_silencio) return;
  try {
    _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume();

    const t0 = _audioCtx.currentTime + delay;
    const osc = _audioCtx.createOscillator();
    const gan = _audioCtx.createGain();

    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t0);
    gan.gain.setValueAtTime(0.0001, t0);
    gan.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gan.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gan).connect(_audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  } catch (e) { /* audio no disponible */ }
}

const sonidoBola   = () => { _tono(760, 0.12, "triangle", 0.13); _tono(1180, 0.16, "triangle", 0.11, 0.09); };
const sonidoGirar  = () => { for (let i = 0; i < 8; i++) _tono(300 + i * 90, 0.05, "square", 0.045, i * 0.11); };
const sonidoMarcar = () => _tono(1500, 0.06, "sine", 0.09);
const sonidoError  = () => { _tono(200, 0.16, "square", 0.10); _tono(150, 0.22, "square", 0.10, 0.10); };
const sonidoGanar  = () => [523, 659, 784, 1047, 1319].forEach((f, i) => _tono(f, 0.30, "sawtooth", 0.09, i * 0.12));

/* ============================================================
   7) CONFETI Y PARTÍCULAS
   ============================================================ */
const COLORES_NEON = ["#ff2fd0", "#b6ff2f", "#22e8ff", "#9b5cff", "#ffd93d"];

function lanzarConfeti(cantidad = 70) {
  const cont = document.createElement("div");
  cont.className = "confeti-contenedor";
  document.body.appendChild(cont);

  for (let i = 0; i < cantidad; i++) {
    const p = document.createElement("i");
    p.className = "confeti";
    const w = 6 + Math.random() * 8;
    p.style.left = Math.random() * 100 + "vw";
    p.style.width = w + "px";
    p.style.height = w * 1.5 + "px";
    p.style.background = COLORES_NEON[Math.floor(Math.random() * COLORES_NEON.length)];
    p.style.animationDelay = (Math.random() * 0.5).toFixed(2) + "s";
    p.style.animationDuration = (1.5 + Math.random() * 1.6).toFixed(2) + "s";
    p.style.setProperty("--rot", Math.round(Math.random() * 900 - 450) + "deg");
    cont.appendChild(p);
  }
  setTimeout(() => cont.remove(), 3600);
}

function miniConfeti(el) {
  const r = el.getBoundingClientRect();
  const cont = document.createElement("div");
  cont.className = "mini-confeti";
  cont.style.left = (r.left + r.width / 2) + "px";
  cont.style.top  = (r.top + r.height / 2) + "px";
  document.body.appendChild(cont);

  for (let i = 0; i < 10; i++) {
    const p = document.createElement("i");
    const ang = Math.random() * Math.PI * 2;
    const dist = 24 + Math.random() * 40;
    p.style.background = COLORES_NEON[Math.floor(Math.random() * COLORES_NEON.length)];
    p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
    p.style.setProperty("--dy", Math.sin(ang) * dist + "px");
    cont.appendChild(p);
  }
  setTimeout(() => cont.remove(), 700);
}

/* ============================================================
   8) AYUDANTES DE PRESENCIA / SALA
   ============================================================ */

function leerSalaDeURL() {
  return (new URLSearchParams(location.search).get("sala") || "").toUpperCase().trim();
}

function enlaceJugadores(codigo) {
  const url = new URL("jugador.html", location.href);
  url.searchParams.set("sala", codigo);
  return url.href;
}

async function copiarAlPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (_) {}
    ta.remove();
    return true;
  }
}