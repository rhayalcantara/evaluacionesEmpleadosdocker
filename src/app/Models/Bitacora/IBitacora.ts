/**
 * Contratos de la Bitácora de Eventos de Desempeño (Fase 3, RRHH 2026-09-11).
 * Escritos por el orquestador; los constructores NO los modifican.
 * Espejo de Models/BitacoraEvento.cs del API (JSON camelCase).
 */

export type TipoEvento = 'Logro' | 'Incumplimiento' | 'Iniciativa' | 'Conducta';
export type ImpactoEvento = 'Alto' | 'Medio' | 'Bajo';

export const TIPOS_EVENTO: { valor: TipoEvento; etiqueta: string; clase: string }[] = [
  { valor: 'Logro',          etiqueta: 'Logro',          clase: 'evento-logro' },
  { valor: 'Incumplimiento', etiqueta: 'Incumplimiento', clase: 'evento-incumplimiento' },
  { valor: 'Iniciativa',     etiqueta: 'Iniciativa',     clase: 'evento-iniciativa' },
  { valor: 'Conducta',       etiqueta: 'Conducta',       clase: 'evento-conducta' },
];

export const IMPACTOS_EVENTO: { valor: ImpactoEvento; etiqueta: string }[] = [
  { valor: 'Alto',  etiqueta: 'Alto' },
  { valor: 'Medio', etiqueta: 'Medio' },
  { valor: 'Bajo',  etiqueta: 'Bajo' },
];

export const DESCRIPCION_MIN = 30;
export const DESCRIPCION_MAX = 2000;

/** Competencia evidenciada por un evento (fila de BitacoraEventoCompetencia). */
export interface IBitacoraEventoCompetencia {
  id: number;                 // 0 al crear
  bitacoraEventoId: number;   // 0 al crear
  objetivoId: number;         // Objetivo.Id
  nombre?: string | null;     // solo lectura (lo rellena el API)
  grupo?: string | null;      // solo lectura (GrupoCompetencia.nombre)
}

/** Evento de la bitácora tal como lo devuelve/recibe el API. */
export interface IBitacoraEvento {
  id: number;                     // 0 al crear
  empleadoSecuencial: number;     // colaborador observado
  registradoPorSecuencial: number;// autor (supervisor)
  fechaEvento: string;            // 'YYYY-MM-DD' (fecha del hecho)
  fechaRegistro?: string | null;  // la sella el servidor
  fechaModificacion?: string | null;
  tipo: TipoEvento;
  impacto: ImpactoEvento;
  descripcion: string;
  activo: boolean;
  competencias: IBitacoraEventoCompetencia[];
  registradoPorNombre?: string | null; // solo lectura (lo rellena el API)
}

/** Fila de GET /api/BitacoraEventos/resumen?empleadoid=&periodoid= */
export interface IBitacoraResumenCompetencia {
  objetivoId: number;
  nombre: string;
  grupo: string;
  logros: number;
  incumplimientos: number;
  iniciativas: number;
  conductas: number;
  total: number;
  eventos: IBitacoraEvento[];   // los eventos del periodo que evidencian esta competencia
}

/** Fila de GET /api/BitacoraEventos/equipo?supervisor=&desde=&hasta= */
export interface IBitacoraResumenEmpleado {
  empleadoSecuencial: number;
  nombre: string;
  cargo?: string | null;
  total: number;
  logros: number;
  incumplimientos: number;
  iniciativas: number;
  conductas: number;
  ultimoEvento?: string | null; // 'YYYY-MM-DD'
}

/** Filtros de la lista (GET /api/BitacoraEventos). Todos opcionales salvo empleadoSecuencial. */
export interface IBitacoraFiltro {
  empleadoSecuencial: number;
  desde?: string | null;   // 'YYYY-MM-DD'
  hasta?: string | null;
  tipo?: TipoEvento | null;
  objetivoId?: number | null;
}

/** Competencia del catálogo (Objetivo agrupado por GrupoCompetencia) para el formulario. */
export interface ICompetenciaCatalogo {
  objetivoId: number;
  nombre: string;
  grupoId: number;
  grupo: string;
}

/** Resultado de la validación del formulario (bitacora-utils.validarEvento). */
export interface IValidacionEvento {
  valido: boolean;
  errores: string[];   // mensajes en español, uno por regla incumplida, en orden fijo
}
