// =============================================================================
// Diario de Estudio - Lógica principal (app.js)
// =============================================================================

// Clave utilizada para guardar y leer los datos en localStorage
const CLAVE_LOCALSTORAGE = "diario_estudio_sesiones";

// -----------------------------------------------------------------------------
// 1. Referencias a los elementos del DOM (HTML)
// -----------------------------------------------------------------------------
const formulario = document.getElementById("formularioSesion");
const campoFecha = document.getElementById("campoFecha");
const campoTema = document.getElementById("campoTema");
const campoMinutos = document.getElementById("campoMinutos");
const contadorRacha = document.getElementById("contadorRacha");
const textoDias = document.getElementById("textoDias");
const contadorMejorRacha = document.getElementById("contadorMejorRacha");
const textoDiasMejor = document.getElementById("textoDiasMejor");
const valorTiempoTotal = document.getElementById("valorTiempoTotal");
const valorTotalSesiones = document.getElementById("valorTotalSesiones");
const valorDiasMes = document.getElementById("valorDiasMes");
const listaSesiones = document.getElementById("listaSesiones");

// -----------------------------------------------------------------------------
// 2. Funciones para manejar fechas locales (sin desfase horario de UTC)
// -----------------------------------------------------------------------------

/**
 * Convierte un objeto Date a formato local "YYYY-MM-DD"
 * usando los métodos locales getFullYear(), getMonth() y getDate().
 */
function obtenerFechaLocalTexto(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/**
 * Convierte un texto "YYYY-MM-DD" en un objeto Date en hora local (medianoche).
 * Evita el constructor new Date("YYYY-MM-DD") que interpreta en UTC.
 */
function crearFechaLocal(fechaTexto) {
  const [anio, mes, dia] = fechaTexto.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

/**
 * Formatea una fecha "YYYY-MM-DD" para mostrarla de forma amigable (ej. "5 de octubre de 2026")
 */
function formatearFechaParaMostrar(fechaTexto) {
  const fecha = crearFechaLocal(fechaTexto);
  return fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// -----------------------------------------------------------------------------
// 3. Manejo de LocalStorage (Guardar y cargar datos)
// -----------------------------------------------------------------------------

/**
 * Carga las sesiones guardadas en localStorage. Si no hay ninguna, retorna un array vacío.
 */
function cargarSesiones() {
  const datos = localStorage.getItem(CLAVE_LOCALSTORAGE);
  if (!datos) return [];
  try {
    return JSON.parse(datos);
  } catch (error) {
    console.error("Error al leer datos de localStorage:", error);
    return [];
  }
}

/**
 * Guarda el array de sesiones en localStorage convertido a texto JSON.
 */
function guardarSesionesEnStorage(sesiones) {
  localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(sesiones));
}

// -----------------------------------------------------------------------------
// 4. Cálculo de la racha actual
// -----------------------------------------------------------------------------

/**
 * Calcula los días consecutivos con estudio según las reglas:
 * - Un día cuenta si tiene al menos una sesión.
 * - La racha termina hoy.
 * - Si hoy aún no se ha estudiado pero ayer sí, la racha sigue viva empezando desde ayer.
 * - Si ni hoy ni ayer se ha estudiado, la racha es 0.
 */
function calcularRacha(sesiones) {
  if (sesiones.length === 0) return 0;

  // Creamos un conjunto (Set) con todas las fechas únicas que tienen sesiones
  const fechasConEstudio = new Set(sesiones.map((s) => s.fecha));

  const hoy = new Date();
  const hoyTexto = obtenerFechaLocalTexto(hoy);

  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const ayerTexto = obtenerFechaLocalTexto(ayer);

  // Decidimos desde qué día empezar a contar hacia atrás:
  let fechaRevision = new Date();

  if (fechasConEstudio.has(hoyTexto)) {
    // Si hoy se estudió, empezamos a revisar desde hoy
    fechaRevision = hoy;
  } else if (fechasConEstudio.has(ayerTexto)) {
    // Si hoy no se ha estudiado pero ayer sí, la racha sigue viva empezando desde ayer
    fechaRevision = ayer;
  } else {
    // Si ni hoy ni ayer se estudió, la racha es 0
    return 0;
  }

  // Contamos los días consecutivos hacia atrás
  let racha = 0;
  while (true) {
    const fechaTexto = obtenerFechaLocalTexto(fechaRevision);
    if (fechasConEstudio.has(fechaTexto)) {
      racha++;
      // Retrocedemos un día
      fechaRevision.setDate(fechaRevision.getDate() - 1);
    } else {
      // En cuanto encontramos un día sin estudio, se corta la racha
      break;
    }
  }

  return racha;
}

/**
 * Calcula la mejor racha histórica de días consecutivos con al menos una sesión.
 * - Descarta fechas futuras (no suman según AGENTS.md).
 * - Considera días únicos con estudio ordenados cronológicamente.
 * - Compara la diferencia de días entre fechas consecutivas.
 * - Garantiza que la mejor racha sea al menos igual a la racha actual activa.
 */
function calcularMejorRacha(sesiones) {
  if (!sesiones || sesiones.length === 0) return 0;

  const hoyTexto = obtenerFechaLocalTexto(new Date());

  // 1. Filtrar sesiones válidas: descartar fechas futuras
  const fechasValidas = sesiones
    .map((s) => s.fecha)
    .filter((fecha) => fecha <= hoyTexto);

  if (fechasValidas.length === 0) return 0;

  // 2. Fechas únicas ordenadas cronológicamente (de más antigua a más reciente)
  const fechasUnicasOrdenadas = Array.from(new Set(fechasValidas)).sort();

  let mejorRacha = 1;
  let rachaActualBloque = 1;

  // 3. Recorremos día a día verificando si cada uno es consecutivo del anterior
  for (let i = 1; i < fechasUnicasOrdenadas.length; i++) {
    const fechaAnterior = crearFechaLocal(fechasUnicasOrdenadas[i - 1]);
    const fechaActual = crearFechaLocal(fechasUnicasOrdenadas[i]);

    // Diferencia en días enteros usando medianoche local
    const diffMilisegundos = fechaActual - fechaAnterior;
    const diffDias = Math.round(diffMilisegundos / (1000 * 60 * 60 * 24));

    if (diffDias === 1) {
      rachaActualBloque++;
    } else {
      rachaActualBloque = 1;
    }

    if (rachaActualBloque > mejorRacha) {
      mejorRacha = rachaActualBloque;
    }
  }

  // 4. La mejor racha siempre es al menos tan grande como la racha actual activa
  const rachaActual = calcularRacha(sesiones);
  return Math.max(mejorRacha, rachaActual);
}

// -----------------------------------------------------------------------------
// 5. Renderizado en pantalla (Actualizar la interfaz visual)
// -----------------------------------------------------------------------------

/**
 * Actualiza los contadores de racha actual y mejor racha con su texto gramatical.
 */
function renderizarRacha(sesiones) {
  const racha = calcularRacha(sesiones);
  contadorRacha.textContent = racha;
  textoDias.textContent = racha === 1 ? "día seguido" : "días seguidos";

  const mejorRacha = calcularMejorRacha(sesiones);
  contadorMejorRacha.textContent = mejorRacha;
  textoDiasMejor.textContent = mejorRacha === 1 ? "día récord" : "días récord";
}

/**
 * Convierte un total de minutos en formato legible (ej. "45 min", "2 h", "2 h 15 min").
 */
function formatearMinutosLegibles(totalMinutos) {
  if (!totalMinutos || totalMinutos <= 0) return "0 min";
  if (totalMinutos < 60) return `${totalMinutos} min`;

  const horas = Math.floor(totalMinutos / 60);
  const minutosRestantes = totalMinutos % 60;

  if (minutosRestantes === 0) {
    return `${horas} h`;
  }
  return `${horas} h ${minutosRestantes} min`;
}

/**
 * Calcula las estadísticas globales a partir de las sesiones existentes.
 * - totalMinutos: suma de minutos acumulados en todas las sesiones.
 * - totalSesiones: número total de sesiones registradas.
 * - diasEsteMes: días únicos estudiados en el mes en curso (hora local del usuario).
 */
function calcularEstadisticas(sesiones) {
  const totalSesiones = sesiones.length;
  const totalMinutos = sesiones.reduce((acumulado, sesion) => {
    return acumulado + (Number(sesion.minutos) || 0);
  }, 0);

  // Conteo de días del mes en curso respetando la skill local-dates:
  // 1. Fecha local de hoy en formato "AAAA-MM-DD"
  const hoyTexto = obtenerFechaLocalTexto();
  const prefijoMesActual = hoyTexto.slice(0, 7); // "AAAA-MM"

  // 2. Filtramos sesiones del mes actual y descartamos fechas futuras (s.fecha <= hoyTexto)
  // 3. Usamos Set para asegurar que varias sesiones el mismo día cuenten como 1 solo día
  const diasUnicosMes = new Set(
    sesiones
      .filter((s) => s.fecha.startsWith(prefijoMesActual) && s.fecha <= hoyTexto)
      .map((s) => s.fecha)
  );

  const diasEsteMes = diasUnicosMes.size;

  return { totalMinutos, totalSesiones, diasEsteMes };
}

/**
 * Actualiza los valores del panel de estadísticas globales en la interfaz.
 */
function renderizarEstadisticas(sesiones) {
  const { totalMinutos, totalSesiones, diasEsteMes } = calcularEstadisticas(sesiones);
  valorTiempoTotal.textContent = formatearMinutosLegibles(totalMinutos);
  valorTotalSesiones.textContent = totalSesiones;
  valorDiasMes.textContent = diasEsteMes;
}

/**
 * Renderiza la lista de sesiones ordenadas de la más reciente a la más antigua.
 */
function renderizarSesiones(sesiones) {
  // Limpiamos el contenido anterior
  listaSesiones.innerHTML = "";

  if (sesiones.length === 0) {
    listaSesiones.innerHTML = `
      <div class="estado-vacio">
        El pergamino aguarda en blanco. ¡Inscribe tu primera vigilia de estudio para encender el fuego sagrado!
      </div>
    `;
    return;
  }

  // Ordenamos una copia de las sesiones:
  // 1. Por fecha descendente (la más reciente primero)
  // 2. Si es la misma fecha, la añadida más recientemente primero (por id / timestamp)
  const sesionesOrdenadas = [...sesiones].sort((a, b) => {
    if (b.fecha !== a.fecha) {
      return b.fecha.localeCompare(a.fecha);
    }
    return (b.id || 0) - (a.id || 0);
  });

  // Generamos el HTML para cada sesión
  sesionesOrdenadas.forEach((sesion) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "item-sesion";

    const fechaFormateada = formatearFechaParaMostrar(sesion.fecha);
    const etiquetaMinutos = sesion.minutos === 1 ? "1 minuto" : `${sesion.minutos} min`;

    tarjeta.innerHTML = `
      <div class="info-sesion">
        <strong class="tema-sesion">${escaparHTML(sesion.tema)}</strong>
        <span class="fecha-sesion">${fechaFormateada}</span>
      </div>
      <div class="tiempo-sesion">${etiquetaMinutos}</div>
    `;

    listaSesiones.appendChild(tarjeta);
  });
}

/**
 * Pequeña función de seguridad para evitar inyección de código (XSS) al mostrar el tema
 */
function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// -----------------------------------------------------------------------------
// 6. Manejo del formulario (Añadir nueva sesión)
// -----------------------------------------------------------------------------

function manejarEnvioFormulario(evento) {
  evento.preventDefault();

  const fecha = campoFecha.value;
  const tema = campoTema.value.trim();
  const minutos = parseInt(campoMinutos.value, 10);

  // Validaciones
  if (!fecha) {
    alert("Por favor, selecciona una fecha.");
    campoFecha.focus();
    return;
  }

  if (!tema) {
    alert("Por favor, escribe el tema que has estudiado.");
    campoTema.focus();
    return;
  }

  if (isNaN(minutos) || minutos <= 0) {
    alert("Por favor, ingresa un número de minutos mayor a 0.");
    campoMinutos.focus();
    return;
  }

  // Creamos el nuevo objeto de sesión
  const nuevaSesion = {
    id: Date.now(), // Identificador único basado en el momento exacto
    fecha: fecha,
    tema: tema,
    minutos: minutos
  };

  // Cargamos las sesiones actuales, agregamos la nueva y guardamos
  const sesiones = cargarSesiones();
  sesiones.push(nuevaSesion);
  guardarSesionesEnStorage(sesiones);

  // Actualizamos la interfaz
  renderizarRacha(sesiones);
  renderizarEstadisticas(sesiones);
  renderizarSesiones(sesiones);

  // Limpiamos los campos del formulario pero dejamos la fecha de hoy lista
  campoTema.value = "";
  campoMinutos.value = "";
  campoFecha.value = obtenerFechaLocalTexto();
  campoTema.focus();
}

// -----------------------------------------------------------------------------
// 7. Inicialización de la aplicación
// -----------------------------------------------------------------------------

function iniciarApp() {
  // Establecemos por defecto la fecha de hoy en el campo de fecha
  campoFecha.value = obtenerFechaLocalTexto();

  // Escuchamos el evento de envío del formulario
  formulario.addEventListener("submit", manejarEnvioFormulario);

  // Cargamos los datos guardados y los mostramos en pantalla
  const sesiones = cargarSesiones();
  renderizarRacha(sesiones);
  renderizarEstadisticas(sesiones);
  renderizarSesiones(sesiones);
}

// Arrancamos la aplicación cuando el documento esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarApp);
} else {
  iniciarApp();
}
