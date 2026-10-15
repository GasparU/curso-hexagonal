/**
 * Valores por defecto para el e2e. Si una variable ya está en el entorno, se
 * respeta (así podés apuntar a tu propia base sin tocar este archivo).
 * Se carga con `setupFiles` antes de importar AppModule.
 */
process.env.DB_HOST ??= 'localhost';
process.env.DB_PORT ??= '5433';
process.env.DB_USER ??= 'vacante';
process.env.DB_PASSWORD ??= 'vacante';
process.env.DB_NAME ??= 'vacante';
process.env.PORT ??= '3000';
process.env.NODE_ENV ??= 'test';
