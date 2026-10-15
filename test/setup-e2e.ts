/**
 * Valores por defecto para el e2e. Se respetan las variables que ya estén en el
 * entorno (así podés apuntar a tu propia base sin tocar este archivo).
 * Se carga con `setupFiles` en test/jest-e2e.json, ANTES de importar AppModule.
 */
process.env.DB_HOST ??= 'localhost';
process.env.DB_PORT ??= '5433';
process.env.DB_USER ??= 'vacante';
process.env.DB_PASSWORD ??= 'vacante';
process.env.DB_NAME ??= 'vacante';
process.env.PORT ??= '3000';
process.env.NODE_ENV ??= 'test';
