import { IEmpleado } from "../Empleado/IEmpleado"
import { IEmpleadoDesempeno } from "../EmpleadoDesempeno/IEmpleadoDesempeno"
import { IEvaluacionDesempenoMeta } from "../EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta"
import { IMeta, IMetaDts } from "../Meta/IMeta"
import { ICursoCapacitacion, IEvaluacionCursoCapacitacion } from "../Capacitacion/Cursos"

export interface IEvaluacion {
    id: number
    periodId: number
    secuencialempleado: number
    totalCalculo: number
    fechaRepuestas: string
    observacion: string
    evaluacionGoals: IEvaluacionGoal[]
    evaluacionDesempenoMetas:IEvaluacionDesempenoMeta[]
    goalEmpleadoRespuestas: IGoalEmpleadoRespuesta[]    
    empleado?: IEmpleado
    cursosCapacitacion?: ICursoCapacitacion[]
    evaluacionCursoCapacitacions?:IEvaluacionCursoCapacitacion[]
    puntuaciondesempenocolaborador:number
    puntuacioncompetenciacolaborador:number
    totalcolaborador:number
    puntuaciondesempenosupervidor:number
    puntuacioncompetenciasupervisor:number
    totalsupervisor:number
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


  export interface IEvaluacionDto{
    id: number
    periodId: number
    secuencialempleado: number
    totalCalculo: number
    fechaRepuestas: string
    observacion: string
    goalEmpleadoRespuestas: IGoalEmpleadoRespuesta[]
    evaluacionDesempenoMetas:IEvaluacionDesempenoMeta[]
    cursosCapacitacion?: ICursoCapacitacion[]
    evaluacionCursoCapacitacions?:IEvaluacionCursoCapacitacion[]
    puntuaciondesempenocolaborador:number
    puntuacioncompetenciacolaborador:number
    totalcolaborador:number
    puntuaciondesempenosupervidor:number
    puntuacioncompetenciasupervisor:number
    totalsupervisor:number
  }

  export interface IEvalucionResultDto{
    evaluacionId:number
    id:number
    inverso:boolean
    perspectiva:string
    objetivo:string
    tipo:string
    meta:number
    peso:number
  }

  export interface IEvaluacionResultMostrarDto extends IEvalucionResultDto{
    logrado:number
    porciento:number
  }
