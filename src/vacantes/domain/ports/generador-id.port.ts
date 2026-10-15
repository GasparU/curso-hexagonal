export interface GeneradorDeId {
  generar(): string;
}

export const GENERADOR_DE_ID = Symbol('GeneradorDeId');
