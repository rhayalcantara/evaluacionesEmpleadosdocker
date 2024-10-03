import { IEstado } from "../Estado/IEstado"
import { IPeriodo } from "../Periodos/IPeriodo"

export interface IObjetivo {
    id: number
    grupocompetenciaid:number
    nombre: string
    descripcion: string
    periodoId: number
    estadoId: number
    fecha: string
  }
  export interface IObjetivoDts extends IObjetivo {
    period: IPeriodo
    estado: IEstado
    grupocompetencia:IGrupoCompetencia
    periodo:string
    estad:string
    grupoc:string
  }
  export interface IGrupoCompetencia{
    id:number
    nombre:string
  }