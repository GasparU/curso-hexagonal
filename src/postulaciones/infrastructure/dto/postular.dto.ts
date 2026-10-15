import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Validación de BORDE (nivel 1). El dominio vuelve a validar con sus value objects (nivel 2). */
export class PostularDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombreCompleto!: string;

  @IsString()
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener exactamente 8 dígitos.' })
  documentoIdentidad!: string;

  @IsEmail()
  correo!: string;
}
