import { EventoDeDominio } from './evento-de-dominio';

export class VacanteCerrada implements EventoDeDominio {
  constructor(
    readonly vacanteId: string,
    readonly ocurridaEn: Date,
  ) {}
}
