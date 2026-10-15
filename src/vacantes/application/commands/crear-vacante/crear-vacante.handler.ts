import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Vacante } from '../../../domain/entities/vacante.entity';
import { GENERADOR_DE_ID, GeneradorDeId } from '../../../../comun/domain/ports/generador-id.port';
import { RELOJ, Reloj } from '../../../../comun/domain/ports/reloj.port';
import { VACANTE_REPOSITORIO, VacanteRepositorio } from '../../../domain/ports/vacante.repository';
import { Descripcion } from '../../../domain/value-objects/descripcion.vo';
import { PerfilCargo } from '../../../domain/value-objects/perfil-cargo.vo';
import { Titulo } from '../../../domain/value-objects/titulo.vo';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { CrearVacanteCommand } from './crear-vacante.command';

/** Orquesta: arma el dominio, lo persiste y devuelve el id. No tiene reglas de negocio. */
@CommandHandler(CrearVacanteCommand)
export class CrearVacanteHandler implements ICommandHandler<CrearVacanteCommand, string> {
  constructor(
    @Inject(VACANTE_REPOSITORIO) private readonly vacantes: VacanteRepositorio,
    @Inject(GENERADOR_DE_ID) private readonly generadorDeId: GeneradorDeId,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  async execute(comando: CrearVacanteCommand): Promise<string> {
    const vacante = Vacante.crear(
      VacanteId.generar(this.generadorDeId),
      Titulo.crear(comando.titulo),
      Descripcion.crear(comando.descripcion),
      PerfilCargo.crear(comando.perfilCargo),
      this.reloj.ahora(),
    );

    await this.vacantes.guardar(vacante);
    return vacante.id.valor;
  }
}
