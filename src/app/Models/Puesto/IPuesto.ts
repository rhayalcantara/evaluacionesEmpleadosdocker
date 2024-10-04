import { IDepartamento } from "../Departamento/IDepartamento"

export interface IPuesto{
    secuencial:number
    descripcion:string
    departmentSecuencial:number
    departamento:string
}
export interface IPuestoDts extends IPuesto{
   deparment:IDepartamento
   
}