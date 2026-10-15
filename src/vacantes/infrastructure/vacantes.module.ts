import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrearVacanteHandler } from '../application/commands/crear-vacante/crear-vacante.handler';
import { PublicarVacanteHandler } from '../application/commands/publicar-vacante/publicar-vacante.handler';
import { ObtenerVacanteHandler } from '../application/queries/obtener-vacante/obtener-vacante.handler';
import {
  GENERADOR_DE_ID,
} from '../domain/ports/generador-id.port';
import { PUBLICADOR_DE_EVENTOS } from '../domain/ports/publicador-eventos.port';
import { RELOJ } from '../domain/ports/reloj.port';
import { SALDO_CREDITOS_REPOSITORIO } from '../domain/ports/saldo-creditos.repository';
import { VACANTE_REPOSITORIO } from '../domain/ports/vacante.repository';
import { VacantesController } from './controllers/vacantes.controller';
import { NestPublicadorDeEventos } from './events/nest-publicador-eventos';
import { SaldoCreditosOrmEntity } from './persistence/orm/saldo-creditos.orm-entity';
import { VacanteOrmEntity } from './persistence/orm/vacante.orm-entity';
import { TypeOrmSaldoCreditosRepositorio } from './persistence/typeorm-saldo-creditos.repository';
import { TypeOrmVacanteRepositorio } from './persistence/typeorm-vacante.repository';
import { SistemaReloj } from './services/sistema-reloj';
import { UuidGeneradorDeId } from './services/uuid-generador-id';

/** Acá se decide QUÉ adaptador implementa cada puerto. Cambiar de adaptador = cambiar una línea. */
@Module({
  imports: [TypeOrmModule.forFeature([VacanteOrmEntity, SaldoCreditosOrmEntity])],
  controllers: [VacantesController],
  providers: [
    CrearVacanteHandler,
    PublicarVacanteHandler,
    ObtenerVacanteHandler,
    { provide: VACANTE_REPOSITORIO, useClass: TypeOrmVacanteRepositorio },
    { provide: SALDO_CREDITOS_REPOSITORIO, useClass: TypeOrmSaldoCreditosRepositorio },
    { provide: PUBLICADOR_DE_EVENTOS, useClass: NestPublicadorDeEventos },
    { provide: RELOJ, useClass: SistemaReloj },
    { provide: GENERADOR_DE_ID, useClass: UuidGeneradorDeId },
  ],
})
export class VacantesModule {}
