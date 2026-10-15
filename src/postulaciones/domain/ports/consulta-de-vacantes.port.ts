import { VacanteId } from '../value-objects/vacante-id.vo';

/**
 * Puerto PROPIO de Postulaciones para preguntarle a Vacantes si una vacante existe.
 * Postulaciones no importa el dominio de Vacantes (§4): declara su puerto y lo
 * implementa un adaptador en `infrastructure/`.
 */
export interface ConsultaDeVacantes {
  existe(vacanteId: VacanteId): Promise<boolean>;
}

export const CONSULTA_DE_VACANTES = Symbol('ConsultaDeVacantes');
