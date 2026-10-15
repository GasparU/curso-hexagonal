import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

/** Validación de BORDE (nivel 1). El dominio vuelve a validar con sus value objects (nivel 2). */
export class CrearVacanteDto {
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  titulo!: string;

  @IsString()
  @MinLength(20)
  descripcion!: string;

  @IsIn(['PROFESIONAL', 'OPERARIO'])
  perfilCargo!: string;
}
