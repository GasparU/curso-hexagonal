import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainException, ErrorKind } from '../../domain/errors/domain.exception';

/** Único lugar que traduce el `kind` del dominio a un código HTTP. */
const ESTADO_POR_KIND: Record<ErrorKind, number> = {
  VALIDATION: HttpStatus.BAD_REQUEST,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
};

@Catch(DomainException)
export class FiltroExcepcionesDominio implements ExceptionFilter {
  catch(excepcion: DomainException, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const estado = ESTADO_POR_KIND[excepcion.kind];

    respuesta.status(estado).json({
      statusCode: estado,
      code: excepcion.code,
      message: excepcion.message,
    });
  }
}
