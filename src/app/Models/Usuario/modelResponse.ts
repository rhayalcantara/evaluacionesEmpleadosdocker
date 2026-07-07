export interface ModelResponse<T = any>{
    exito:number
    mensaje:string
    count:number
    data:T
}