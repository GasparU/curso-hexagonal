import { Postulacion } from './postulacion.entity';
import { PostulacionEnviada } from '../events/postulacion-enviada.event';
import { CorreoElectronico } from '../value-objects/correo-electronico.vo';
import { DocumentoIdentidad } from '../value-objects/documento-identidad.vo';
import { NombreCompleto } from '../value-objects/nombre-completo.vo';
import { PostulacionId } from '../value-objects/postulacion-id.vo';
import { VacanteId } from '../value-objects/vacante-id.vo';

const POSTULACION_ID = '22222222-2222-4222-8222-222222222222';
const VACANTE_ID = '11111111-1111-4111-8111-111111111111';
const AHORA = new Date('2026-02-01T10:00:00Z');

function nuevaPostulacion(): Postulacion {
  return Postulacion.registrar(
    PostulacionId.desde(POSTULACION_ID),
    VacanteId.desde(VACANTE_ID),
    NombreCompleto.crear('Ana Pérez'),
    DocumentoIdentidad.crear('12345678'),
    CorreoElectronico.crear('ana@correo.com'),
    AHORA,
  );
}

describe('Postulacion', () => {
  it('nace en RECIBIDA con la fecha indicada', () => {
    const postulacion = nuevaPostulacion();

    expect(postulacion.estado.valor).toBe('RECIBIDA');
    expect(postulacion.creadaEn).toEqual(AHORA);
  });

  it('normaliza el correo al crearse', () => {
    expect(nuevaPostulacion().correo.valor).toBe('ana@correo.com');
  });

  it('REGISTRA PostulacionEnviada al nacer y tomarEventos lo entrega una sola vez', () => {
    const postulacion = nuevaPostulacion();

    const eventos = postulacion.tomarEventos();

    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toBeInstanceOf(PostulacionEnviada);
    expect((eventos[0] as PostulacionEnviada).vacanteId).toBe(VACANTE_ID);
    expect(postulacion.tomarEventos()).toHaveLength(0); // ya se entregaron
  });

  it('fromPrimitives rehidrata el estado que viene de la base y vuelve a validar', () => {
    const postulacion = Postulacion.fromPrimitives({
      id: POSTULACION_ID,
      vacanteId: VACANTE_ID,
      nombreCompleto: 'Ana Pérez',
      documentoIdentidad: '12345678',
      correo: 'ana@correo.com',
      // estado distinto al de nacimiento: debe respetarse tal cual
      estado: 'CONTRATADA',
      creadaEn: AHORA,
    });

    expect(postulacion.estado.valor).toBe('CONTRATADA');
  });

  it('fromPrimitives RECHAZA un primitivo inválido', () => {
    expect(() =>
      Postulacion.fromPrimitives({
        id: POSTULACION_ID,
        vacanteId: VACANTE_ID,
        nombreCompleto: 'Ana Pérez',
        documentoIdentidad: '12345678',
        correo: 'ana@correo.com',
        estado: 'EN_TRAMITE',
        creadaEn: AHORA,
      }),
    ).toThrow('El estado indicado no es válido.');
  });

  it('toPrimitives() y fromPrimitives() van y vuelven sin perder nada', () => {
    const postulacion = nuevaPostulacion();

    const vuelta = Postulacion.fromPrimitives(postulacion.toPrimitives());

    expect(vuelta.toPrimitives()).toEqual(postulacion.toPrimitives());
  });

  it('rehidratar NO vuelve a registrar el evento: los eventos nacen de una acción, no de leer la base', () => {
    const postulacion = Postulacion.fromPrimitives({
      id: POSTULACION_ID,
      vacanteId: VACANTE_ID,
      nombreCompleto: 'Ana Pérez',
      documentoIdentidad: '12345678',
      correo: 'ana@correo.com',
      estado: 'RECIBIDA',
      creadaEn: AHORA,
    });

    expect(postulacion.tomarEventos()).toHaveLength(0);
  });
});
