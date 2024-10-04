import { IMeta, IMetaDts } from "../Meta/IMeta"

export interface IEvaluacion {
    id: number
    periodId: number
    secuencialempleado: number
    totalCalculo: number
    fechaRepuestas: string
    observacion: string
    evaluacionGoals: IEvaluacionGoal[]
    goalEmpleadoRespuestas: IGoalEmpleadoRespuesta[]
  }
  export interface IEvaluacionGoal {
    id: number
    evaluacionId: number
    goalId: number
    goal:IMetaDts
  }

  export interface IGoalEmpleadoRespuesta {
    id: number
    evaluacionId: number
    goalId: number
    repuesta: number
    repuestasupervisor:number
    weight: number
    observacion: string
  }