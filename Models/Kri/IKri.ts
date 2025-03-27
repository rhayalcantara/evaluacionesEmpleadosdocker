
export interface IKri {
    id: number;
    objetivoExtrategicoId: number;
    descripcion: string;
    ponderacion: number;

}

export interface IKriAno {
    id: number
    kriId: number
    plan_AnosId: number
    porcientoValor: string
    valor: number
    inverso: boolean
    logro: number
  }