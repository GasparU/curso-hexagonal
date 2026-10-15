import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { errorDeDominio } from '../../../../comun/domain/errors/error-codes';
import {
  PUBLICADOR_DE_EVENTOS,
  PublicadorDeEventos,
} from '../../../../comun/domain/ports/publicador-eventos.port';
import { RELOJ, Reloj } from '../../../../comun/domain/ports/reloj.port';
import {
  SALDO_CREDITOS_REPOSITORIO,
  SaldoCreditosRepositorio,
} from '../../../domain/ports/saldo-creditos.repository';
import { VACANTE_REPOSITORIO, VacanteRepositorio } from '../../../domain/ports/vacante.repository';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { PublicarVacanteCommand } from './publicar-vacante.command';

/**
 * Orquesta: carga la vacante y el saldo, delega la regla en el dominio, persiste
 * y recién entonces publica el evento.
 */
@CommandHandler(PublicarVacanteCommand)
export class PublicarVacanteHandler implements ICommandHandler<PublicarVacanteCommand, void> {
  constructor(
    @Inject(VACANTE_REPOSITORIO) private readonly vacantes: VacanteRepositorio,
    @Inject(SALDO_CREDITOS_REPOSITORIO) private readonly saldos: SaldoCreditosRepositorio,
    @Inject(PUBLICADOR_DE_EVENTOS) private readonly publicador: PublicadorDeEventos,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  async execute(comando: PublicarVacanteCommand): Promise<void> {
    const vacante = await this.vacantes.buscarPorId(VacanteId.desde(comando.vacanteId));
    if (!vacante) {
      throw errorDeDominio('VACANTE_NO_ENCONTRADA');
    }

    const saldo = await this.saldos.obtener();
    if (!saldo) {
      // si no hay fila de saldo, se asume cero
      throw errorDeDominio('CREDITOS_INSUFICIENTES');
    }

    const ahora = this.reloj.ahora();
    const saldoRestante = vacante.publicar(saldo, ahora);

    await this.vacantes.guardar(vacante);
    await this.saldos.guardar(saldoRestante);

    // recién después de guardar
    await this.publicador.publicar(vacante.tomarEventos());
  }
}
