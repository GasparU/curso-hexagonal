import { EventoDeDominio } from '../../../comun/domain/evento-de-dominio';

/**
 * Se publica una vez guardada la postulación. Lo escucha el contexto Vacantes,
 * desde `vacantes/infrastructure/listeners/`.
 */
export class PostulacionEnviada implements EventoDeDominio {
  constructor(
    readonly postulacionId: string,
    readonly vacanteId: string,
    readonly ocurridaEn: Date,
  ) {}
}
