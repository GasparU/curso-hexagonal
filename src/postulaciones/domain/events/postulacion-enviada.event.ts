import { EventoDeDominio } from '../../../comun/domain/evento-de-dominio';

/**
 * Se emite DESPUÉS de persistir la postulación. Lo escucha el contexto Vacantes
 * (su listener está en `vacantes/infrastructure/listeners/`).
 */
export class PostulacionEnviada implements EventoDeDominio {
  constructor(
    readonly postulacionId: string,
    readonly vacanteId: string,
    readonly ocurridaEn: Date,
  ) {}
}
