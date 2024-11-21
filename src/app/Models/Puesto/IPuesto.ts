import { IDepartamento } from "../Departamento/IDepartamento"

export interface IPuesto{
    secuencial:number
    descripcion:string
    departmentSecuencial:number
    departamento:string
    categoriaPuestoId:number
}
export interface IPuestoDts extends IPuesto{
   deparment:IDepartamento
   
}

export interface ICategoriaPuesto{
    id:number
    descripcion:string
}