import { Injectable } from '@nestjs/common';
import { Reloj } from '../../domain/ports/reloj.port';

@Injectable()
export class SistemaReloj implements Reloj {
  ahora(): Date {
    return new Date();
  }
}
