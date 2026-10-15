import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComunModule } from '../../comun/infrastructure/comun.module';
import { VacantesModule } from '../../vacantes/infrastructure/vacantes.module';
import { PostularHandler } from '../application/commands/postular/postular.handler';
import { ListarPostulacionesDeVacanteHandler } from '../application/queries/listar-postulaciones-de-vacante/listar-postulaciones-de-vacante.handler';
import { CONSULTA_DE_VACANTES, ConsultaDeVacantes } from '../domain/ports/consulta-de-vacantes.port';
import { POSTULACION_REPOSITORIO, PostulacionRepositorio } from '../domain/ports/postulacion.repository';
import {
  REGISTRO_DE_POSTULACIONES,
  RegistroDePostulaciones,
} from '../domain/services/registro-de-postulaciones';
import { ConsultaDeVacantesAdapter } from './adapters/consulta-de-vacantes.adapter';
import { PostulacionesController } from './controllers/postulaciones.controller';
import { PostulacionOrmEntity } from './persistence/orm/postulacion.orm-entity';
import { TypeOrmPostulacionRepositorio } from './persistence/typeorm-postulacion.repository';

/**
 * Contexto Postulaciones. Depende de `ComunModule` (transversales) y de
 * `VacantesModule` SOLO para implementar su puerto de consulta cruzada:
 * nunca importa el dominio de Vacantes.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PostulacionOrmEntity]), ComunModule, VacantesModule],
  controllers: [PostulacionesController],
  providers: [
    PostularHandler,
    ListarPostulacionesDeVacanteHandler,
        { provide: POSTULACION_REPOSITORIO, useClass: TypeOrmPostulacionRepositorio },
        { provide: CONSULTA_DE_VACANTES, useClass: ConsultaDeVacantesAdapter },
        // el servicio de dominio se arma con los PUERTOS: el módulo decide qué
        // implementación concreta recibe (acá, los adaptadores de arriba)
        {
          provide: REGISTRO_DE_POSTULACIONES,
          useFactory: (postulaciones: PostulacionRepositorio, vacantes: ConsultaDeVacantes) =>
            new RegistroDePostulaciones(postulaciones, vacantes),
          inject: [POSTULACION_REPOSITORIO, CONSULTA_DE_VACANTES],
        },
  ],
})
export class PostulacionesModule {}
