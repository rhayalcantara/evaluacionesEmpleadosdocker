import { IEmpleado } from "../Empleado/IEmpleado"

export interface IRol{
    id:number
    name:string
    nivel:number    
}
export interface IEmpleadoRol{
    id:number
    empleadoSecuencial:number
    rolId:number
    rol:IRol
    empleado:IEmpleado
}
export interface IEmpleadoRolDTs{
    id:number
    empleadoSecuencial:number
    rolId:number
}
