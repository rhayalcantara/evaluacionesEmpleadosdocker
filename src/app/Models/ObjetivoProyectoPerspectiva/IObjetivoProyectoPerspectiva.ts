export interface IObjetivoProyectoPerspectiva {
    id: number;
    tipo: 'Objetivos' | 'Proyecto';  // Using union type to restrict values
    objetivoEstrategicoId: number;
    descripcion?: string;  // Optional property using ?
    valor: number;
}
