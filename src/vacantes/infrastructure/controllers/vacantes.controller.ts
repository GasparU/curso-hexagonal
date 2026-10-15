import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CrearVacanteCommand } from '../../application/commands/crear-vacante/crear-vacante.command';
import { PublicarVacanteCommand } from '../../application/commands/publicar-vacante/publicar-vacante.command';
import { ObtenerVacanteQuery } from '../../application/queries/obtener-vacante/obtener-vacante.query';
import { VacanteVista } from '../../application/queries/obtener-vacante/vacante.vista';
import { CrearVacanteDto } from '../dto/crear-vacante.dto';

/**
 * El controlador NO llama handlers ni repositorios: publica en los buses.
 * Es la primera regla de CQRS que revisa la rúbrica.
 */
@Controller('vacantes')
export class VacantesController {
  constructor(
    private readonly busDeComandos: CommandBus,
    private readonly busDeConsultas: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearVacanteDto): Promise<{ id: string }> {
    const id = await this.busDeComandos.execute(
      new CrearVacanteCommand(dto.titulo, dto.descripcion, dto.perfilCargo),
    );
    return { id };
  }

  @Post(':id/publicar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async publicar(@Param('id') id: string): Promise<void> {
    await this.busDeComandos.execute(new PublicarVacanteCommand(id));
  }

  @Get(':id')
  async obtener(@Param('id') id: string): Promise<VacanteVista> {
    return this.busDeConsultas.execute(new ObtenerVacanteQuery(id));
  }
}
