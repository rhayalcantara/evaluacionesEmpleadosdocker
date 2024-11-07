export interface IObjetivoProyectoPerspectiva {
    id: number;
    tipo: 'Objetivos' | 'Proyecto';  // Using union type to restrict values
    perspervaId: number;
    descripcion?: string;  // Optional property using ?
    valor: number;
}
