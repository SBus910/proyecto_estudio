# Memoria del Proyecto: Diario de Estudio

## Estado actual
- **Registro y persistencia:** Formulario para registrar sesiones (fecha local, tema, minutos), listado cronológico inverso y almacenamiento en `localStorage`.
- **Rachas:** Tarjeta con racha actual (🔥) y mejor racha histórica (🏆).
- **Diseño visual:** Rediseño temático *Grimorio de Estudio* (medieval fantástico) aplicando la skill `frontend-design`.
- **Skills del proyecto:**
  - `local-dates`: `.agents/skills/local-dates/SKILL.md` (reglas y checklist de fechas locales).
  - `frontend-design`: `.agents/skills/frontend-design/SKILL.md` (metodología y principios de diseño y UI intencional).

## Decisiones importantes y porqué
- **Rediseño Medieval Fantástico (Grimorio):** Diseñado con un punto de vista distintivo (fondo piedra de templo, pergamino oscuro, detalles en oro arcano y rubí de lacre), tipografías Cinzel y MedievalSharp, evitando los clichés comunes de UI genéricas de IA.
- **Skill dedicada para fechas (`local-dates`):** Estandarización de reglas estrictas de fecha local y checklist obligatorio.
- **Cálculo al vuelo sin alterar localStorage:** Tanto la "Mejor racha" como las "Estadísticas globales" se calculan dinámicamente en tiempo de ejecución a partir del array de sesiones para máxima compatibilidad.
- **Manejo de fechas locales:** Se utiliza `crearFechaLocal(fechaTexto)` con `Date(anio, mes - 1, dia)` en hora local.
- **Formato amigable de tiempo:** Los minutos acumulados se convierten a `"X h Y min"` (o `"X h"` si minutos son 0).

## Errores a evitar
- **No usar métodos UTC para fechas:** No usar `toISOString()` ni `new Date("AAAA-MM-DD")`.
- **No romper la estructura de localStorage:** Mantener `{ id, fecha, tema, minutos }` sin añadir claves redundantes.
