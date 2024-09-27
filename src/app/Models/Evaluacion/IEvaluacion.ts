import {IEmpleado} from '../Empleado/IEmpleado'
import { IMeta } from '../Meta/IMeta'
import { IPeriodo } from '../Periodos/IPeriodo'
export interface IEvaluacion {
    id: number
    periodId: number
    secuencialempleado: number
    totalCalculo: number
    fechaRepuestas: string
    observacion: string
    empleado: IEmpleado
    period: IPeriodo
    evaluacionGoals: IEvaluacionGoal[]
    goalEmpleadoRespuestas: IGoalEmpleadoRespuesta[]
  }
  export interface IEvaluacionGoal {
    id: number
    evaluacionId: number
    goalId: number
    goal: IMeta
    evaluacion: IEvaluacion
  }

  export interface IGoalEmpleadoRespuesta {
    id: number
    evaluacionId: number
    goalId: number
    repuesta: number
    weight: number
    observacion: string
  }