import { EventoDeDominio } from './evento-de-dominio';

export class VacantePublicada implements EventoDeDominio {
  constructor(
    readonly vacanteId: string,
    readonly ocurridaEn: Date,
  ) {}
}
