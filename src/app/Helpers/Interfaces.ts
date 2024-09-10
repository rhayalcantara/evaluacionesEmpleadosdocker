export interface FotoPadron {
  identificacion: string;
  imagen:Uint8Array[];
}
export interface Usuario{
    id: number
    codigo: string
    nombre: string
    emailinterno: string
    identificacion: string
    esnulo: number
    verificado: number

  }
  export interface AuthRequest{
    usuario:string;
    clave:string;
    
  }
  export interface Response{
    exito:number;
    mensaje:string;
    data:any;
  }
  export interface TableResponse{
    key:object;
    option:string;
  }
export interface TipoCampo{
  campo:string;
  tipo:string;
  arraydata:any[];
  arrayid:string;
  arraynombre:string;
}
export interface MiObjeto {
  [clave: string]: string; // Esto permite cualquier número de propiedades de tipo string
}