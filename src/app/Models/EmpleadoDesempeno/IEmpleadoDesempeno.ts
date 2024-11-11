import { IEmpleado } from "../Empleado/IEmpleado";
import { IKpi } from "../Kpi/IKpi";
import { IKri } from "../Kri/IKri";
import { IObjetivoProyectoPerspectiva } from "../ObjetivoProyectoPerspectiva/IObjetivoProyectoPerspectiva";

export interface IEmpleadoDesempeno {
    id: number;
    secuencialId: number;
    kriId: number;
    kpiId: number;
    objetivoProyectoId: number;
    periodoId: number;
    empleado?:IEmpleado;
    kri?:IKri;
    kpi?:IKpi;
    objetivoProyecto?:IObjetivoProyectoPerspectiva;
}
