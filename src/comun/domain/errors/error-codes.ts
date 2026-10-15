import { DomainException, ErrorKind } from './domain.exception';

export interface DefinicionError {
  kind: ErrorKind;
  mensaje: string;
}

/**
 * Catálogo de errores de negocio, compartido por los dos contextos.
 * El `code` es el contrato con el cliente: no se cambia a la ligera.
 */
export const ERRORES = {
  ID_INVALIDO: { kind: 'VALIDATION', mensaje: 'El identificador no tiene un formato válido.' },
  TITULO_INVALIDO: {
    kind: 'VALIDATION',
    mensaje: 'El título debe tener entre 5 y 120 caracteres.',
  },
  DESCRIPCION_MUY_CORTA: {
    kind: 'VALIDATION',
    mensaje: 'La descripción debe tener al menos 20 caracteres.',
  },
  PERFIL_CARGO_INVALIDO: {
    kind: 'VALIDATION',
    mensaje: 'El perfil del cargo debe ser PROFESIONAL u OPERARIO.',
  },
  NOMBRE_INVALIDO: {
    kind: 'VALIDATION',
    mensaje: 'El nombre completo debe tener entre 3 y 120 caracteres.',
  },
  DNI_INVALIDO: { kind: 'VALIDATION', mensaje: 'El DNI debe tener exactamente 8 dígitos.' },
  CORREO_INVALIDO: {
    kind: 'VALIDATION',
    mensaje: 'El correo electrónico no tiene un formato válido.',
  },
  ESTADO_INVALIDO: { kind: 'VALIDATION', mensaje: 'El estado indicado no es válido.' },
  SALDO_INVALIDO: {
    kind: 'VALIDATION',
    mensaje: 'El saldo de créditos debe ser un entero mayor o igual a cero.',
  },
  VACANTE_NO_ENCONTRADA: {
    kind: 'NOT_FOUND',
    mensaje: 'No se encontró la vacante indicada.',
  },
  VACANTE_YA_PUBLICADA: { kind: 'CONFLICT', mensaje: 'La vacante ya está publicada.' },
  VACANTE_YA_CERRADA: { kind: 'CONFLICT', mensaje: 'La vacante ya está cerrada.' },
  VACANTE_NO_PUBLICADA: {
    kind: 'CONFLICT',
    mensaje: 'Primero hay que publicar la vacante antes de cerrarla.',
  },
  CREDITOS_INSUFICIENTES: {
    kind: 'CONFLICT',
    mensaje: 'No hay saldo de créditos suficiente para publicar la vacante.',
  },
  POSTULANTE_YA_POSTULO: {
    kind: 'CONFLICT',
    mensaje: 'El postulante ya se postuló a esta vacante.',
  },
} as const satisfies Record<string, DefinicionError>;

export type CodigoError = keyof typeof ERRORES;

export function errorDeDominio(code: CodigoError): DomainException {
  const definicion = ERRORES[code];
  return new DomainException(code, definicion.kind, definicion.mensaje);
}
