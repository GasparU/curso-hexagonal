import { errorDeDominio } from '../errors/error-codes';
import { GeneradorDeId } from '../ports/generador-id.port';

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class VacanteId {
  private constructor(private readonly uuid: string) {}

  static generar(generador: GeneradorDeId): VacanteId {
    return new VacanteId(generador.generar());
  }

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
