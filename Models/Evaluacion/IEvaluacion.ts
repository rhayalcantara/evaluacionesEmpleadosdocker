import { IEmpleado } from "../Empleado/IEmpleado"
import { IEmpleadoDesempeno } from "../EmpleadoDesempeno/IEmpleadoDesempeno"
import { IEvaluacionDesempenoMeta } from "../EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta"
import { IMeta, IMetaDts } from "../Meta/IMeta"
import { ICursoCapacitacion, IEvaluacionCursoCapacitacion } from "../Capacitacion/Cursos"

export interface IEvaluacion {
    id: number
    periodId: number
    empleadoSecuencial: number
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
    estadoevaluacion:string
    entrevistaConSupervisor: boolean
    aceptaEnDisgusto: boolean
    comentarioDisgusto: string
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
    observacionsupervisor:string
  }

  export interface IEvaluacionEstadoDts {
    EvaluacionId: number
    EmpleadoSecuencial:number
    estadoEvaluacion:string
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
    estadoevaluacion:string
    entrevistaConSupervisor?: boolean
    aceptaEnDisgusto?: boolean
    comentarioDisgusto?: string
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

  export interface IReporte01 {
  evaluacionid: number;
  identificacion: string;
  colaborador: string;
  fechA_INGRESO: string;
  supersivos: string;
  departamento: string;
  sucursal: string;
  posision: string;
  evaluadopor: string;
  tipO_ROL: string;
  tienE_META: string;
  estatus_evaluacion: string;
  puntuaciondesempenocolaborador: number;
  totalcolaborador: number;
  puntuaciondesempenosupervidor: number;
  puntuacioncompetenciasupervisor: number;
  totalCalculo: number;
  oficina: string;
}

export interface IReporte02 {
  evaluacionId: number;
  enfoqueAlSocio: number;
  enfoqueAResultados: number;
  flexibilidadYAdaptacion: number;
  trabajoEnEquipoComunicacionInterpersonalInteligenciaEmocional: number;
  desarrolloPersonalYAutoAprendizaje: number;
  enfoqueALosSistemasInstitucionalesRegulacionesYCulturales: number;
  tomaDeDecisionesCorajeGerencialEstiloColaboracion: number;
  supervisionDesarrolloYMotivacionOtros: number;
  habilidadesDeComunicacionYPresenciaProfesional: number;
  tomaDeDecisionesYSolucionCreativaProblemas: number;
  pensamientoAnaliticoYRigorIntelectual: number;
  conocimientoDelNegocioEnfoqueEstrategicoVisionYProposito: number;
  enfoqueAlSocioSupervisor: number;
  enfoqueAResultadosSupervisor: number;
  flexibilidadYAdaptacionSupervisor: number;
  trabajoEnEquipoComunicacionInterpersonalInteligenciaEmocionalSupervisor: number;
  desarrolloPersonalYAutoAprendizajeSupervisor: number;
  enfoqueALosSistemasInstitucionalesRegulacionesYCulturalesSupervisor: number;
  tomaDeDecisionesCorajeGerencialEstiloColaboracionSupervisor: number;
  supervisionDesarrolloYMotivacionOtrosSupervisor: number;
  habilidadesDeComunicacionYPresenciaProfesionalSupervisor: number;
  tomaDeDecisionesYSolucionCreativaProblemasSupervisor: number;
  pensamientoAnaliticoYRigorIntelectualSupervisor: number;
  conocimientoDelNegocioEnfoqueEstrategicoVisionYPropositoSupervisor: number;
  id: number;
  periodId: number;
  empleadoSecuencial: number;
  totalCalculo: number;
  fechaRepuestas: string;
  observacion: string;
  secuenciaSupervisor: number;
  puntuacionCompetenciaColaborador: number;
  puntuacionCompetenciaSupervisor: number;
  puntuacionDesempenoColaborador: number;
  puntuacionDesempenoSupervisor: number;
  totalColaborador: number;
  totalSupervisor: number;
  estadoEvaluacion: string;
  entrevistaConSupervisor?: boolean
  aceptaEnDisgusto?: boolean
  comentarioDisgusto?: string
}
