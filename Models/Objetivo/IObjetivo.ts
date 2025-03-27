import { IEstado } from "../Estado/IEstado"
import { IPeriodo } from "../Periodos/IPeriodo"

export interface IObjetivo {
    id: number
    grupoCompetenciaId:number
    nombre: string
    descripcion: string
    periodoId: number
    estadoId: number
    fecha: string
    grupoCompetencia:IGrupoCompetencia
  }
  export interface IObjetivoDts extends IObjetivo {
    period: IPeriodo
    estado: IEstado
    grupoCompetencia:IGrupoCompetencia
    periodo:string
    estad:string
    grupoc:string
  }
  export interface IGrupoCompetencia{
    id:number
    nombre:string
  }