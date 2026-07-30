## Objetivo

Convertir la app (hoy de una sola temporada) en multi-temporada, sin tocar ni un solo dato existente. Todo lo que hay ahora en Firestore pasa a considerarse **Temporada 2025/2026** y queda congelado en modo solo lectura.

## 1. Registro de temporadas y selector

- Nuevo archivo `src/config/seasons.ts` con la lista de temporadas:
  - `2025-2026` — etiqueta "Temporada 2025/2026", `readOnly: true`, colecciones heredadas (`matchdays`, `teams`, `match_reports`).
  - `2026-2027` — etiqueta "Temporada 2026/2027", `readOnly: false`, activa por defecto.
- Nuevo `SeasonContext` (`src/contexts/SeasonContext.tsx`) que guarda la temporada seleccionada y la persiste en `localStorage`.
- Selector desplegable en el `Header` (junto al icono de notificaciones): `[ Temporada 2026/2027 ▾ ]`. En móvil se muestra compacto (`26/27 ▾`).
- Al elegir una temporada histórica aparece una banda discreta "Modo consulta · Temporada finalizada" y el panel de Admin se bloquea (solo lectura).

## 2. Aislamiento de datos por temporada

`useLeagueData` pasa a leer las colecciones de la temporada activa:

```text
2025/2026 (histórico)   matchdays            teams            match_reports
2026/2027 (actual)      matchdays_2026_2027  teams            match_reports_2026_2027
```

- Clasificación, pichichi, tarjetas, actas y play-offs se recalculan sobre la temporada seleccionada. Al abrir 2025/2026 se ve exactamente la foto final actual.
- Los equipos siguen viviendo en una sola colección `teams` (mismo ID de equipo entre temporadas), pero con nombre y plantilla por temporada (punto 3).

## 3. Nombres de equipo por temporada

- Cada documento de equipo gana un mapa opcional `seasonNames`:
  ```json
  { "2026-2027": "CLINICA DENT. DOCTOR DOBLADO" }
  ```
- Helper `getTeamName(team, season)` que devuelve `seasonNames[season] ?? name`. Se usa en clasificación, actas, play-offs, escudos y buscadores.
- Migración puntual (un solo clic desde Admin, idempotente) que añade:
  - Transtello Miajadas → `2026-2027`: **CLINICA DENT. DOCTOR DOBLADO**
  - Inter Don Benito → `2026-2027`: **Gimnástico Don Benito**
- El nombre histórico nunca se sobrescribe: al consultar 2025/2026 se siguen viendo "Transtello Miajadas" e "Inter Don Benito".

## 4. Plantillas por temporada

- El array `players` actual se conserva intacto como plantilla 2025/2026.
- Nuevo mapa `rosters` en el documento de equipo: `rosters["2026-2027"] = Player[]`, vacío por defecto.
- `AdminTeamsView` muestra y edita la plantilla de la temporada activa.

## 5. Renovaciones y traspasos (Admin, solo 2026/2027)

Dentro de la ficha de equipo del Admin, dos bloques nuevos debajo de la plantilla actual:

- **Jugadores de la temporada pasada**: lista de los jugadores que tuvo ese mismo equipo en 2025/2026, cada uno con botón `[+ Renovar]` que lo añade a la plantilla 2026/2027 conservando su ID (para que su histórico siga enlazado). Botón adicional "Renovar todos".
- **[+ Registrar Traspaso]**: modal con buscador sobre todos los jugadores de la temporada anterior (de cualquier equipo), mostrando su club de origen. Al confirmar, se incorpora a la plantilla 2026/2027 del club actual — sin borrarlo del histórico del club de origen.
- Ambos bloques evitan duplicados (jugador ya presente aparece marcado como "Ya en plantilla").

## Notas técnicas

- Ningún documento existente se modifica salvo el añadido de los campos `seasonNames` / `rosters`; el histórico es aditivo y reversible.
- Escrituras bloqueadas por guarda `if (season.readOnly) return` en todos los formularios de Admin, además de ocultar los botones.
- Los play-offs (`playoff-*`) siguen filtrándose igual, ahora dentro de la colección de su temporada.
- Programación defensiva: `getTeamName` y los accesos a `rosters` usan optional chaining con fallback al comportamiento actual, de modo que un equipo sin configurar sigue funcionando.
