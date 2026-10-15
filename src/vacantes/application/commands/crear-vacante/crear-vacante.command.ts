export class CrearVacanteCommand {
  constructor(
    readonly titulo: string,
    readonly descripcion: string,
    readonly perfilCargo: string,
  ) {}
}
