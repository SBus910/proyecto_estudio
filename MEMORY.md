# Memoria del Proyecto: Diario de Estudio

## Estado actual
- **Versión 1 operativa:** Registro de sesiones (fecha, tema, minutos), cálculo de racha actual, listado cronológico inverso y persistencia de datos en `localStorage`.
- **Nueva funcionalidad (Mejor racha):** Se agregó el cálculo de la "Mejor racha" histórica (récord de días consecutivos), mostrándola junto a la racha actual en la interfaz.

## Decisiones importantes y porqué
- **Cálculo al vuelo vs campo guardado:** La "Mejor racha" se calcula dinámicamente en tiempo de ejecución a partir del array de sesiones. Esto evita romper la compatibilidad con los datos existentes en `localStorage` y previene inconsistencias si el usuario registra sesiones pasadas o altera los datos.
- **Manejo de fechas:** Se utiliza una función auxiliar `crearFechaLocal(fechaTexto)` que instancia `Date(anio, mes - 1, dia)` (medianoche local). Esto asegura que los cálculos de diferencia de días sean precisos y evita desfases horarios (UTC) causados por funciones nativas como `toISOString()`.
- **Diseño UI:** La tarjeta principal se dividió para mostrar "Racha actual 🔥" y "Mejor racha 🏆" lado a lado, manteniendo un diseño limpio y adaptable a dispositivos móviles.

## Errores a evitar
- **No usar métodos UTC para fechas:** Trabajar siempre extrayendo año, mes y día de forma explícita para evitar que una fecha se asigne al día anterior por la zona horaria del usuario.
- **No romper la estructura de localStorage:** Cualquier nueva métrica debe calcularse a partir de la estructura `{ date, topic, minutes }` original si es posible, para no perder los datos del usuario.
