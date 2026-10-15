import { errorDeDominio } from '../../../comun/domain/errors/error-codes';
import { GeneradorDeId } from '../../../comun/domain/ports/generador-id.port';

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class PostulacionId {
  private constructor(private readonly uuid: string) {}

  static generar(generador: GeneradorDeId): PostulacionId {
    return new PostulacionId(generador.generar());
  }

  static desde(uuid: string): PostulacionId {
    if (!REGEX_UUID.test(uuid ?? '')) {
      throw errorDeDominio('ID_INVALIDO');
    }
    return new PostulacionId(uuid.toLowerCase());
  }

  get valor(): string {
    return this.uuid;
  }

  equals(otro: PostulacionId): boolean {
    return this.uuid === otro.uuid;
  }
}
