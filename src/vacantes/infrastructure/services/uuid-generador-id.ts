import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { GeneradorDeId } from '../../domain/ports/generador-id.port';

@Injectable()
export class UuidGeneradorDeId implements GeneradorDeId {
  generar(): string {
    return randomUUID();
  }
}
