import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComunModule } from '../../comun/infrastructure/comun.module';
import { CrearVacanteHandler } from '../application/commands/crear-vacante/crear-vacante.handler';
import { PublicarVacanteHandler } from '../application/commands/publicar-vacante/publicar-vacante.handler';
import { ObtenerVacanteHandler } from '../application/queries/obtener-vacante/obtener-vacante.handler';
import { SALDO_CREDITOS_REPOSITORIO } from '../domain/ports/saldo-creditos.repository';
import { VACANTE_REPOSITORIO } from '../domain/ports/vacante.repository';
import { VacantesController } from './controllers/vacantes.controller';
import { VacantePostulacionListener } from './listeners/vacante-postulacion.listener';
import { SaldoCreditosOrmEntity } from './persistence/orm/saldo-creditos.orm-entity';
import { VacanteOrmEntity } from './persistence/orm/vacante.orm-entity';
import { TypeOrmSaldoCreditosRepositorio } from './persistence/typeorm-saldo-creditos.repository';
import { TypeOrmVacanteRepositorio } from './persistence/typeorm-vacante.repository';

/**
 * Acá se decide qué adaptador implementa cada puerto de Vacantes.
 * Los transversales (reloj, ids, eventos) los provee `ComunModule`.
 * `VACANTE_REPOSITORIO` se exporta porque Postulaciones lo usa para verificar
 * que la vacante exista.
 */
@Module({
  imports: [TypeOrmModule.forFeature([VacanteOrmEntity, SaldoCreditosOrmEntity]), ComunModule],
  controllers: [VacantesController],
  providers: [
    CrearVacanteHandler,
    PublicarVacanteHandler,
    ObtenerVacanteHandler,
    VacantePostulacionListener,
    { provide: VACANTE_REPOSITORIO, useClass: TypeOrmVacanteRepositorio },
    { provide: SALDO_CREDITOS_REPOSITORIO, useClass: TypeOrmSaldoCreditosRepositorio },
  ],
  exports: [VACANTE_REPOSITORIO],
})
export class VacantesModule {}
