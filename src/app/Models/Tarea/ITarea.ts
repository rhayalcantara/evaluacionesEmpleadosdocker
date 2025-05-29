export interface ITarea {
  id: number;
  descripcion: string;
  pasos: string[];
  fechaInicio: Date;
  fechaPropuestaEntrega: Date;
  fechaTerminada: Date | null;
  estado: string;
  empleadoId: number;
}
