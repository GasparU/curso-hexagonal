import { errorDeDominio } from '../../../comun/domain/errors/error-codes';

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Referencia a una vacante. Es el value object de este contexto: los dos
 * contextos no comparten value objects. Solo lleva el identificador.
 */
export class VacanteId {
  private constructor(private readonly uuid: string) {}

  static desde(uuid: string): VacanteId {
    if (!REGEX_UUID.test(uuid ?? '')) {
      throw errorDeDominio('ID_INVALIDO');
    }
    return new VacanteId(uuid.toLowerCase());
  }

  get valor(): string {
    return this.uuid;
  }

  equals(otro: VacanteId): boolean {
    return this.uuid === otro.uuid;
  }
}
