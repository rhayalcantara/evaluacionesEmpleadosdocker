export interface IExcepcionSupervisorInmediato {
  id: number;
  excepcionId: number;
  empleadoId: number;
  departamentoOriginalId: number;
  jefeOriginalId: number;
  nuevoDepartamentoId: number;
  nuevoJefeId: number;
  fechaInicio: Date;
  fechaFin: Date;
}
export interface IExcepcionSupervisorInmediatoDts 
        extends IExcepcionSupervisorInmediato
{  
  nombreEmpleado: string
  nombreDepartmentoriginal: string
  nombrejefeoriginal: string
  nombrenuevojefe: string
  nombrenuevodepartamento: string 
}