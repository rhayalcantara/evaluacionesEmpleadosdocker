import { IDepartamento } from "./Departamento/IDepartamento"
import { IEmpleado } from "./Empleado/IEmpleado"
import { ISucursal } from "./Sucursal/ISucursal"
import { ISuplidor } from "./Suplidor/ISuplidor"

export interface IMovRelacionado {
    id: 0,
    mov_enc_id: 0,
    empleado_id: 0,
    empleado:IEmpleado,
    sucurlsal_id: 0,
    sucursal: ISucursal,
    suplidor_id: 0,
    suplidor: ISuplidor,
    departamento_id: 0,
    departamento: IDepartamento,
    entidad:'',
    nombreentidad:''
  }