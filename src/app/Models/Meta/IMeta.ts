import { IDepartamento } from "../Departamento/IDepartamento"
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
}
export interface IMetaDts extends IMeta{
    position:IPuesto,
    elTipos:ITipo,
    puesto: string
    departamento:string
    periodo:string
    Tipo:string
}