import { IEstado } from "../Estado/IEstado"
import { IMeta, IMetaDts } from "../Meta/IMeta"

export interface IPeriodo{
    id:number
    descripcion:string
    fechaInicio:Date
    fechaFin:Date
    activa:boolean
    estadoid:number
}

export interface IPeriodo_Dts extends IPeriodo{
    estado:IEstado
    goals:IMetaDts[]
}