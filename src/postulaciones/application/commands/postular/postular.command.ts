export class PostularCommand {
  constructor(
    readonly vacanteId: string,
    readonly nombreCompleto: string,
    readonly documentoIdentidad: string,
    readonly correo: string,
  ) {}
}
