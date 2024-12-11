import { IEvaluacion } from "../Evaluacion/IEvaluacion";

export interface IEvaluacionDesempenoMeta {
    id: number;
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
    medioverificacion:string;
    comentario:string;
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
    id:number;
    EvaluacionId: number;
    logro:number
    medioverificacion:string
    comentario:string
    porcientologro:number
    resultadologro:number
  }