import { IPuesto } from "../Puesto/IPuesto"
import { ITipo } from "../Tipo/ITipo"

export interface IMeta{
    id:number
    name:string
    periodId:number
    weight:number
    positionSecuencial:number
    tiposid:number
    tipos:ITipo
    objetivoid:number    
}
export interface IMetaDts extends IMeta{
    position:IPuesto,
    elTipos:ITipo,
    puesto: string
    departamento:string
    periodo:string
    Tipo:string
}

export interface IMetadto{
    id:number
    name:string
    periodId:number
    weight:number
    positionSecuencial:number
    tiposid:number    
    objetivoid:number
}