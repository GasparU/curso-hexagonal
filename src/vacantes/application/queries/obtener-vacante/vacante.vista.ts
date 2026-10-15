/** Modelo de lectura: un objeto plano, sin comportamiento. Las queries no devuelven entidades. */
export interface VacanteVista {
  id: string;
  titulo: string;
  descripcion: string;
  perfilCargo: string;
  estado: string;
  creadaEn: string;
  publicadaEn: string | null;
  cerradaEn: string | null;
  postulacionesRecibidas: number;
}
