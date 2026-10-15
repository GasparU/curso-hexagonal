import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FiltroExcepcionesDominio } from './comun/infrastructure/filters/domain-exception.filter';

/**
 * Configuración común de la app: la usan `main.ts` y el e2e, así los dos
 * arrancan con la misma validación y el mismo filtro de errores.
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
