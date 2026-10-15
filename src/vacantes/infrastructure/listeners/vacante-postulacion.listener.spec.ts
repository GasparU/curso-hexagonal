import { EventEmitter2 } from '@nestjs/event-emitter';
import { NestPublicadorDeEventos } from '../../../comun/infrastructure/nest-publicador-eventos';
import { PostularCommand } from '../../../postulaciones/application/commands/postular/postular.command';
import { PostularHandler } from '../../../postulaciones/application/commands/postular/postular.handler';
import { ConsultaDeVacantesAdapter } from '../../../postulaciones/infrastructure/adapters/consulta-de-vacantes.adapter';
import { PostulacionRepositorioEnMemoria } from '../../../postulaciones/infrastructure/persistence/en-memoria/postulacion.repository.en-memoria';
import { Vacante } from '../../domain/entities/vacante.entity';
import { Descripcion } from '../../domain/value-objects/descripcion.vo';
import { PerfilCargo } from '../../domain/value-objects/perfil-cargo.vo';
import { Titulo } from '../../domain/value-objects/titulo.vo';
import { VacanteId } from '../../domain/value-objects/vacante-id.vo';
import { VacanteRepositorioEnMemoria } from '../persistence/en-memoria/vacante.repository.en-memoria';
import { VacantePostulacionListener } from './vacante-postulacion.listener';

const VACANTE_ID = '11111111-1111-4111-8111-111111111111';
const POSTULACION_ID = '22222222-2222-4222-8222-222222222222';
const AHORA = new Date('2026-02-01T10:00:00Z');

/**
 * Prueba la CADENA COMPLETA de los dos contextos, sin Nest:
 * Postulaciones publica el evento -> el publicador real emite -> el listener
 * de Vacantes lo escucha -> la vacante suma la postulación.
 */
describe('Cross-contexto: PostulacionEnviada -> Vacante.registrarPostulacion', () => {
  it('registrar una postulación incrementa el contador de la vacante', async () => {
    const vacantes = new VacanteRepositorioEnMemoria();
    await vacantes.guardar(
      Vacante.crear(
        VacanteId.desde(VACANTE_ID),
        Titulo.crear('Analista de datos'),
        Descripcion.crear('Buscamos un analista con experiencia en SQL.'),
        PerfilCargo.profesional(),
        AHORA,
      ),
    );

    const postulaciones = new PostulacionRepositorioEnMemoria();
    const emisor = new EventEmitter2();

    // el listener real de Vacantes, suscripto al nombre del evento
    const listener = new VacantePostulacionListener(vacantes);
    emisor.on('PostulacionEnviada', (evento) => listener.alRecibirPostulacion(evento));

    const handler = new PostularHandler(
      postulaciones,
      new ConsultaDeVacantesAdapter(vacantes),
      { generar: () => POSTULACION_ID },
      { ahora: () => AHORA },
      new NestPublicadorDeEventos(emisor),
    );

    await handler.execute(
      new PostularCommand(VACANTE_ID, 'Ana Pérez', '12345678', 'ana@correo.com'),
    );

    const vacante = await vacantes.buscarPorId(VacanteId.desde(VACANTE_ID));
    expect(vacante?.postulacionesRecibidas).toBe(1);
    expect(postulaciones.cantidad()).toBe(1);
  });
});
