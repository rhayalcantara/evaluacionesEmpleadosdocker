import { IPeriodo } from '../Periodos/IPeriodo';

export interface IPeriodoEvaluacion {
  id: number
  periodId: number
  positionSecuential: number
  goalId: number
  periodo: IPeriodo
}