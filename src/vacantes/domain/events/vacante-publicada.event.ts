import { EventoDeDominio } from '../../../comun/domain/evento-de-dominio';

export class VacantePublicada implements EventoDeDominio {
  constructor(
    readonly vacanteId: string,
    readonly ocurridaEn: Date,
  ) {}
}
