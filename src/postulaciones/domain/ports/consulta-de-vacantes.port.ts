import { VacanteId } from '../value-objects/vacante-id.vo';

/**
 * Puerto de Postulaciones para preguntarle a Vacantes si una vacante existe.
 * Postulaciones declara lo que necesita y un adaptador lo resuelve; no importa
 * el dominio de Vacantes.
 */
export interface ConsultaDeVacantes {
  existe(vacanteId: VacanteId): Promise<boolean>;
}

export const CONSULTA_DE_VACANTES = Symbol('ConsultaDeVacantes');
