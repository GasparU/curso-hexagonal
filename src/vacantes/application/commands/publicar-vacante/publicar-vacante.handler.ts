import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { errorDeDominio } from '../../../domain/errors/error-codes';
import { VacantePublicada } from '../../../domain/events/vacante-publicada.event';
import {
  PUBLICADOR_DE_EVENTOS,
  PublicadorDeEventos,
} from '../../../domain/ports/publicador-eventos.port';
import { RELOJ, Reloj } from '../../../domain/ports/reloj.port';
import {
  SALDO_CREDITOS_REPOSITORIO,
  SaldoCreditosRepositorio,
} from '../../../domain/ports/saldo-creditos.repository';
import { VACANTE_REPOSITORIO, VacanteRepositorio } from '../../../domain/ports/vacante.repository';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { PublicarVacanteCommand } from './publicar-vacante.command';

/**
 * Orquesta: carga la vacante y el saldo, delega la regla en el dominio, persiste
 * y RECIÉN DESPUÉS publica el evento (el evento habla de algo que ya pasó).
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
      // Sin saldo registrado no se puede publicar: fallamos en cerrado.
      throw errorDeDominio('CREDITOS_INSUFICIENTES');
    }

    const ahora = this.reloj.ahora();
    const saldoRestante = vacante.publicar(saldo, ahora);

    await this.vacantes.guardar(vacante);
    await this.saldos.guardar(saldoRestante);

    await this.publicador.publicar([new VacantePublicada(vacante.id.valor, ahora)]);
  }
}
