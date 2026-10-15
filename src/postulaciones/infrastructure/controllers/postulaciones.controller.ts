import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PostularCommand } from '../../application/commands/postular/postular.command';
import { ListarPostulacionesDeVacanteQuery } from '../../application/queries/listar-postulaciones-de-vacante/listar-postulaciones-de-vacante.query';
import { PostulacionVista } from '../../application/queries/listar-postulaciones-de-vacante/postulacion.vista';
import { PostularDto } from '../dto/postular.dto';

/**
 * El controlador publica en los buses; no toca handlers ni repositorios.
 * La ruta cuelga de `/vacantes/:id` pero el recurso es de este contexto.
 */
@Controller('vacantes/:id/postulaciones')
export class PostulacionesController {
  constructor(
    private readonly busDeComandos: CommandBus,
    private readonly busDeConsultas: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async postular(@Param('id') vacanteId: string, @Body() dto: PostularDto): Promise<{ id: string }> {
    const id = await this.busDeComandos.execute(
      new PostularCommand(vacanteId, dto.nombreCompleto, dto.documentoIdentidad, dto.correo),
    );
    return { id };
  }

  @Get()
  async listar(@Param('id') vacanteId: string): Promise<PostulacionVista[]> {
    return this.busDeConsultas.execute(new ListarPostulacionesDeVacanteQuery(vacanteId));
  }
}
