// Capa de datos y utilidades compartidas para objetivos diarios.
// Usado por index.html, objetivos.html y estadisticas.html.

const OBJETIVOS_KEY = 'objetivosDiarios';
const HITOS_RACHA = [7, 30, 100, 365];

function obtenerHoy() {
  return new Date().toISOString().split('T')[0];
}

function obtenerAyer(desde = new Date()) {
  const d = new Date(desde);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// Índice determinista para "una cosa distinta cada día" (frase, reto, etc.)
function semillaDelDia(offset = 0) {
  const hoy = obtenerHoy();
  let hash = 0;
  for (let i = 0; i < hoy.length; i++) {
    hash = (hash * 31 + hoy.charCodeAt(i)) | 0;
  }
  return Math.abs(hash + offset);
}

function cargarObjetivos() {
  const objetivos = JSON.parse(localStorage.getItem(OBJETIVOS_KEY)) || [];
  let cambiado = false;
  objetivos.forEach(obj => {
    if (!Array.isArray(obj.historial)) {
      obj.historial = obj.ultimaFechaHecho ? [obj.ultimaFechaHecho] : [];
      cambiado = true;
    }
    if (typeof obj.mejorRacha !== 'number') {
      obj.mejorRacha = obj.racha || 0;
      cambiado = true;
    }
  });
  if (cambiado) guardarObjetivos(objetivos);
  return objetivos;
}

function guardarObjetivos(objetivos) {
  localStorage.setItem(OBJETIVOS_KEY, JSON.stringify(objetivos));
}

function agregarObjetivo(texto) {
  const objetivos = cargarObjetivos();
  objetivos.push({ texto, racha: 0, ultimaFechaHecho: '', mejorRacha: 0, historial: [] });
  guardarObjetivos(objetivos);
  return objetivos;
}

// Marca un objetivo como hecho hoy. Devuelve el hito de racha alcanzado (o null).
function marcarHecho(objetivos, indice) {
  const hoy = obtenerHoy();
  const obj = objetivos[indice];
  if (!obj || obj.ultimaFechaHecho === hoy) return null;

  obj.racha = (obj.ultimaFechaHecho === obtenerAyer()) ? (obj.racha || 0) + 1 : 1;
  obj.ultimaFechaHecho = hoy;
  obj.historial.push(hoy);
  if (obj.racha > (obj.mejorRacha || 0)) obj.mejorRacha = obj.racha;

  guardarObjetivos(objetivos);
  return HITOS_RACHA.includes(obj.racha) ? obj.racha : null;
}

function eliminarObjetivo(objetivos, indice) {
  objetivos.splice(indice, 1);
  guardarObjetivos(objetivos);
  return objetivos;
}

function insigniaPara(racha) {
  if (racha >= 365) return '🏆';
  if (racha >= 100) return '💎';
  if (racha >= 30) return '🥇';
  if (racha >= 7) return '🥈';
  return '';
}

// ¿Hay alguna racha viva que se pierde si no se marca hoy?
function algunaRachaEnRiesgo(objetivos) {
  const hoy = obtenerHoy();
  return objetivos.some(o => (o.racha || 0) > 0 && o.ultimaFechaHecho !== hoy);
}

function calcularEstadisticasGlobales() {
  const objetivos = cargarObjetivos();
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(inicioSemana.getDate() - 7);
  const inicioSemanaAnterior = new Date(hoy);
  inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 14);

  let totalCompletados = 0;
  let mejorRachaGlobal = 0;
  let rachaActivaTotal = 0;
  let completadosHoy = 0;
  let hechosEstaSemana = 0;
  let hechosSemanaAnterior = 0;
  const hoyStr = obtenerHoy();

  objetivos.forEach(obj => {
    totalCompletados += obj.historial.length;
    if ((obj.mejorRacha || 0) > mejorRachaGlobal) mejorRachaGlobal = obj.mejorRacha;
    if (obj.ultimaFechaHecho === hoyStr) {
      completadosHoy++;
      rachaActivaTotal += obj.racha || 0;
    }
    obj.historial.forEach(fechaStr => {
      const f = new Date(fechaStr);
      if (f >= inicioSemana) hechosEstaSemana++;
      else if (f >= inicioSemanaAnterior) hechosSemanaAnterior++;
    });
  });

  return {
    totalObjetivos: objetivos.length,
    totalCompletados,
    mejorRachaGlobal,
    rachaActivaTotal,
    completadosHoy,
    hechosEstaSemana,
    hechosSemanaAnterior
  };
}

// Pequeña explosión de confeti con divs, sin dependencias externas.
function lanzarConfeti() {
  const colores = ['#9c2b20', '#14110f', '#c9a24b', '#5b5650'];
  const contenedor = document.createElement('div');
  contenedor.className = 'confeti-contenedor';
  document.body.appendChild(contenedor);

  for (let i = 0; i < 60; i++) {
    const pieza = document.createElement('span');
    pieza.className = 'confeti';
    pieza.style.left = Math.random() * 100 + 'vw';
    pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
    pieza.style.animationDuration = (1.4 + Math.random() * 1.2) + 's';
    pieza.style.animationDelay = (Math.random() * 0.3) + 's';
    pieza.style.transform = `rotate(${Math.random() * 360}deg)`;
    contenedor.appendChild(pieza);
  }

  setTimeout(() => contenedor.remove(), 3000);
}

// Renderiza un mini calendario tipo "heatmap" de los últimos `dias` días.
function renderizarCalendario(contenedor, historial, dias = 70) {
  const marcados = new Set(historial);
  contenedor.innerHTML = '';
  contenedor.className = 'heatmap';

  const hoy = new Date();
  const celdas = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    const clave = d.toISOString().split('T')[0];
    celdas.push({ clave, hecho: marcados.has(clave) });
  }

  celdas.forEach(({ clave, hecho }) => {
    const celda = document.createElement('span');
    celda.className = 'heatmap-celda' + (hecho ? ' hecha' : '');
    celda.title = clave + (hecho ? ' — hecho' : '');
    contenedor.appendChild(celda);
  });
}

// Banner de "no pierdas tu racha", visible desde media tarde si hay algo pendiente.
function mostrarBannerRachaSiAplica(elemento) {
  const objetivos = cargarObjetivos();
  const horaActual = new Date().getHours();

  if (objetivos.length > 0 && algunaRachaEnRiesgo(objetivos) && horaActual >= 18) {
    const enRiesgo = objetivos.filter(o => (o.racha || 0) > 0 && o.ultimaFechaHecho !== obtenerHoy());
    const mayorRacha = Math.max(...enRiesgo.map(o => o.racha || 0));
    elemento.hidden = false;
    elemento.textContent = `⏳ Aún no has marcado ${enRiesgo.length === 1 ? 'tu objetivo' : 'tus objetivos'} de hoy. No rompas tu racha de ${mayorRacha} día${mayorRacha !== 1 ? 's' : ''}.`;
  } else {
    elemento.hidden = true;
  }
}
