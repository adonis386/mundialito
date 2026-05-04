# Liga fantasy de prueba (bots + picks)

Script: `functions/src/seedFantasyDemo.ts` (Admin SDK).

## Requisitos

1. Credenciales Admin en `functions/serviceAccountKey.json` **o** Application Default Credentials.
2. Partidos master seedeados (al menos los de jornada 1 que uses para picks):

   ```bash
   cd functions
   npm run seed:firestore
   ```

## Crear la liga y los competidores ficticios

```bash
cd functions
npm run seed:fantasy-demo -- --tag=lab1 --players=6 --picks=8
```

El comando imprime JSON con **`leagueId`**, **`joinCode`**, emails de login y la **contraseña** (por defecto `FantasyDemo2026!`).

### Opciones útiles

| Flag | Efecto |
|------|--------|
| `--tag=lab1` | Sufijo único; evita colisiones y sirve para idempotencia. |
| `--players=6` | Total de miembros (1 owner + 5 bots). Máximo 24. |
| `--picks=8` | Cuántos partidos de **jornada 1** reciben pick (en orden `md1-01`…). |
| `--password=TuClave` | Misma contraseña para todos los usuarios creados. |
| `--past-kickoff` | Ajusta `md1-01`: kickoff hace 24 h y `status: live` para probar picks cerrados y **pronósticos de la comunidad** en la UI sin esperar al Mundial. |
| `--force` | Vuelve a crear aunque exista marcador `seedMarkers/fantasyDemo_<tag>`. |

## Probar en la app

1. En **Login**, entra con uno de los emails impresos (por ejemplo el owner) y la contraseña.
2. Abre **Ligas** → entra a la liga `Fantasy demo (<tag>)` (ya eres miembro).
3. **Partidos**: los bots ya tienen picks en los primeros N partidos de jornada 1; tú puedes añadir o cambiar los tuyos **antes del kickoff** de cada partido.
4. Con **`--past-kickoff`**, en el partido `md1-01` deberías ver la sección de comunidad al expandir (y picks cerrados por hora).

## Idempotencia

Si ejecutas otra vez el mismo `--tag` sin `--force`, el script no duplica la liga y muestra el marcador existente.

## Datos que crea

- Usuarios en **Firebase Auth** + documento `users/{uid}` con `displayName`.
- Liga privada con `joinCode`, miembros, `leagueMemberships`, `stats` en 0.
- `users/{uid}/picks/{matchId}` con marcadores ficticios variados.
- `leaderboards/current` de la liga con **top a 0 pts** (hasta que un admin marque partidos `final` y corran las Functions).

Para ver **puntos y ranking global** hace falta finalizar al menos un partido en la matriz master (panel admin / consola) para disparar el cálculo.
