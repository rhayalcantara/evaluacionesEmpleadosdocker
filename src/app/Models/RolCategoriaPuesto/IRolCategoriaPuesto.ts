
export interface IRolCategoriaPuesto{
    id:number;
    descripcion:string;
    categorias:IRolCategoriaPuestoDet[]
}
export interface IRolCategoriaPuestoDet{
    id:number
    categoriapuestoId:number
    rolCategoriaId:number
}