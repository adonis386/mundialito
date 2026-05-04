# Administración (Mundialito)

## Rol `admin` (Firebase Auth)

Varias operaciones (por ejemplo `seedMasterMatches` en producción, escritura en la matriz master y en `tournaments/.../knockout`) requieren el **custom claim** `admin: true` en el token de Identity Toolkit.

### Asignar admin a un usuario

1. Obtén el **UID** del usuario en Firebase Console → Authentication.
2. Compila Functions y ejecuta el script de claims (requiere credenciales Admin SDK: `serviceAccountKey.json` en `functions/` o Application Default Credentials):

   ```bash
   cd functions
   npm run build
   node lib/setAdminClaim.js --uid=TU_UID_AQUI
   ```

   También puedes usar `--email=tu@correo.com` en lugar de `--uid=`.

3. El usuario debe **cerrar sesión y volver a entrar** para que el nuevo claim viaje en el JWT.

### Varias cuentas admin

Repite el paso anterior por cada UID. No hace falta un único admin: el claim es por usuario.

### Firestore

Las reglas comprueban `request.auth.token.admin == true` para escrituras sensibles. Los datos públicos (partidos master en lectura, leaderboards globales) siguen siendo legibles según `firestore.rules`.
