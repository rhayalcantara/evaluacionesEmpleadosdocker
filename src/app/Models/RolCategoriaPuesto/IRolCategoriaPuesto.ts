
export interface IRolCategoriaPuesto{
    id:number;
    descripcion:string;
    categorias:IRolCategoriaPuestoDet[]
}
export interface IRolCategoriaPuestoDet{
    id:number
    categoriaPuestoId:number
    rolCategoriaPuestoId:number
}