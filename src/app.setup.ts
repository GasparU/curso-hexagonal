import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FiltroExcepcionesDominio } from './comun/infrastructure/filters/domain-exception.filter';

/**
 * Configuración común de la app. Vive acá para que el e2e arranque con EXACTAMENTE
 * la misma pipa y el mismo filtro que `main.ts` (si no, el e2e prueba otra app).
 */
export function configurarApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // borra campos que no estén en el DTO
      forbidNonWhitelisted: true, // y tira error si mandan campos de más
      transform: true,
    }),
  );

  app.useGlobalFilters(new FiltroExcepcionesDominio());
}
