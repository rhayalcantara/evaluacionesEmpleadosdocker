import { IObjetivo } from "../Objetivo/IObjetivo"
import { IPuesto } from "../Puesto/IPuesto"
import { ITipo } from "../Tipo/ITipo"

export interface IMeta{
    id:number
    name:string
    periodId:number
    weight:number
    positionSecuencial:number
    objetivoid:number    
}
export interface IMetaDts extends IMeta{
    position:IPuesto,
    objetivo:IObjetivo
    puesto: string
    departamento:string
    periodo:string
    objj:string
}

export interface IMetadto{
    id:number
    name:string
    periodId:number
    weight:number
    positionSecuencial:number
    objetivoid:number
}

export interface IPuestoConMetas {
    periodId: number;
    cantidadPuestos: number;
  }