import { IEmpleado } from "../Empleado/IEmpleado";

export interface IException {
    id: number;
    tipo: string;
    empleadoSecuencial: number;
    detalles: string;
    fecha: string;
    activa: boolean;
  }
export interface IExceptionDts extends IException{
    empleado:IEmpleado
    nombreempleado:string
}