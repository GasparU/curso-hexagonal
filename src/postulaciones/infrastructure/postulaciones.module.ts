import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComunModule } from '../../comun/infrastructure/comun.module';
import { VacantesModule } from '../../vacantes/infrastructure/vacantes.module';
import { PostularHandler } from '../application/commands/postular/postular.handler';
import { ListarPostulacionesDeVacanteHandler } from '../application/queries/listar-postulaciones-de-vacante/listar-postulaciones-de-vacante.handler';
import { CONSULTA_DE_VACANTES } from '../domain/ports/consulta-de-vacantes.port';
import { POSTULACION_REPOSITORIO } from '../domain/ports/postulacion.repository';
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
  ],
})
export class PostulacionesModule {}
