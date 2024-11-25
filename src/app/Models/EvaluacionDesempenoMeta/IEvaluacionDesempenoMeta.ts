import { IEvaluacion } from "../Evaluacion/IEvaluacion";

export interface IEvaluacionDesempenoMeta {
    Id: number;
    EvaluacionId: number;
    tipo: string;
    descripcion: string;
    meta: number;
    inverso: boolean;
    evaluacion?: IEvaluacion;
    evaluacionDesempenoRespuestas?: IDesempenoRespuesta;
    evaluacioneDesempenoMetaRespuestas?: IEvaluacionDesempenoMetaRespuesta;
}
export interface IEvaluacionDesempenoMetaRespuesta {
    id: number;
    evaluacionDesempenoMetaId: number;
    logro: number;
}
export interface IDesempenoRespuesta {
    id: number
    evaluacionDesempenoMetaId: number   
    repuesta: number
    repuestasupervisor:number
    weight: number
    observacion: string
  }