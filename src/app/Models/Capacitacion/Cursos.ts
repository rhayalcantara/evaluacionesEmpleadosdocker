export interface ICursoCapacitacion{
    id:number
    descripcion:string
}
export interface IEvaluacionCursoCapacitacion{
    id:number
    evaluacionId:number
    cursoCapacitacionId:number
    cursoCapacitacion?:ICursoCapacitacion
    porque:string
}
export interface IReporteCursos {
  empleadoSecuencial: number;
  nombreUnido: string;
  departamento: string;
  cargo: string;
  curso: string;
  razon: string;
}