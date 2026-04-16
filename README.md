# Quiniela Mundial 2026 (Firebase)

App web/mobile-web para jugar quiniela del Mundial 2026 con **matriz master** de resultados oficiales.

## Stack

- Next.js (React 18) + TypeScript
- Tailwind CSS
- Firebase: Auth + Firestore + Cloud Functions

## Matriz master (fuente de verdad)

- **Resultados oficiales**: `tournaments/2026/matches/{matchId}`
- Cuando un match pasa a `status: "final"` con `score`, una Cloud Function recalcula:
  - `userStats/{uid}` (global)
  - `leagues/{leagueId}/stats/{uid}` (por liga)
  - `leaderboards/global` y `leagues/{leagueId}/leaderboards/current` (top 50)

## Pantallas (UI)

- `/` Inicio
- `/login` Login (placeholder)
- `/matches` Partidos (incluye skeleton + empty state)
- `/leagues` Ligas (empty state + CTAs)
- `/leagues/join` Unirse por código (placeholder para callable)
- `/leaderboard` Ranking global (empty state)

Estados UX previstos:
- loading: skeletons
- empty: cards informativas con CTA
- error: (pendiente de wiring con Firebase)
- feedback: “pick guardado / pick bloqueado por kickoff” (pendiente)

## Desarrollo

1. Crea `.env.local` usando `.env.example`
2. Instala deps:
   - `npm install`
   - `cd functions && npm install`
3. Corre la app:
   - `npm run dev`

## Seguridad (Firestore Rules)

- Master + scoring: solo `admin` (custom claims)
- Picks: solo el usuario y **solo antes del kickoff** (comparando con `kickoffAt` del master)
- Stats/leaderboards: **solo server** (clientes no escriben)
- Ligas: lectura solo miembros; membresías se administran vía Functions

