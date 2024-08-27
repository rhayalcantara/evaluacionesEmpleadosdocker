
export interface Usuario{
    usuario:string;
    clave:string;
    nombres:string;
    apellidos:string;
    email:string;
    created_at: Date;
    updateed_ad:Date;

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