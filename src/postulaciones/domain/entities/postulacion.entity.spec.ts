import { Postulacion } from './postulacion.entity';
import { CorreoElectronico } from '../value-objects/correo-electronico.vo';
import { DocumentoIdentidad } from '../value-objects/documento-identidad.vo';
import { EstadoPostulacion } from '../value-objects/estado-postulacion.vo';
import { NombreCompleto } from '../value-objects/nombre-completo.vo';
import { PostulacionId } from '../value-objects/postulacion-id.vo';
import { VacanteId } from '../value-objects/vacante-id.vo';

const AHORA = new Date('2026-02-01T10:00:00Z');

function nuevaPostulacion(): Postulacion {
  return Postulacion.registrar(
    PostulacionId.desde('22222222-2222-4222-8222-222222222222'),
    VacanteId.desde('11111111-1111-4111-8111-111111111111'),
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

  it('reconstruir rehidrata el estado que viene de la base', () => {
    const postulacion = Postulacion.reconstruir(
      PostulacionId.desde('22222222-2222-4222-8222-222222222222'),
      VacanteId.desde('11111111-1111-4111-8111-111111111111'),
      NombreCompleto.crear('Ana Pérez'),
      DocumentoIdentidad.crear('12345678'),
      CorreoElectronico.crear('ana@correo.com'),
      // estado distinto al de nacimiento: debe respetarse tal cual
      EstadoPostulacion.crear('CONTRATADA'),
      AHORA,
    );

    expect(postulacion.estado.valor).toBe('CONTRATADA');
  });
});
