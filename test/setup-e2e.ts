/**
 * Valores por defecto para el e2e. Si una variable ya está en el entorno, se
 * respeta (así podés apuntar a tu propia base sin tocar este archivo).
 * Se carga con `setupFiles` antes de importar AppModule.
 */
process.env.DB_HOST ??= 'localhost';
process.env.DB_PORT ??= '5433';
process.env.DB_USER ??= 'vacante';
// DB_PASSWORD a propósito NO se define acá: sale del .env, igual que para la app. Si el setup
// pusiera un valor propio, ganaría por venir primero y taparía la clave de tu base.
process.env.DB_NAME ??= 'vacante';
process.env.PORT ??= '3000';
process.env.NODE_ENV ??= 'test';
