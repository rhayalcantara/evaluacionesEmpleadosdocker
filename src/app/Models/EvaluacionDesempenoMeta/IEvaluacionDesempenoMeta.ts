import { IEvaluacion } from "../Evaluacion/IEvaluacion";

export interface IEvaluacionDesempenoMeta {
    Id: number;
    EvaluacionId: number;
    tipo: string;
    descripcion: string;
    meta: number;
    peso:number;
    inverso: boolean;
    evaluacion?: IEvaluacion;
    evaluacionDesempenoRespuestas?: IDesempenoRespuesta;
    evaluacioneDesempenoMetaRespuestas?: IEvaluacionDesempenoMetaRespuesta;
}
export interface IEvaluacionDesempenoMetaRespuesta {
    id: number;
    evaluacionDesempenoMetaId: number;
    logro: number;
    supervisado_logro: number;
}
export interface IDesempenoRespuesta {
    id: number
    evaluacionDesempenoMetaId: number   
    repuesta: number
    repuestasupervisor:number
    weight: number
    observacion: string
  }

  export interface IResultadoLogro{
    EvaluacionId: number;
    logro:number
    porcientologro:number
    resultadologro:number
  }