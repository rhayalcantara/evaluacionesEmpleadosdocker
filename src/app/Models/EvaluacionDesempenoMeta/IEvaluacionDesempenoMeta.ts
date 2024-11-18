import { IEvaluacion } from "../Evaluacion/IEvaluacion";

export interface IEvaluacionDesempenoMeta {
    Id: number;
    EvaluacionId: number;
    Tipo: string;
    descripcion: string;
    meta: number;
    inverso: boolean;
    evaluacion?: IEvaluacion;
}
