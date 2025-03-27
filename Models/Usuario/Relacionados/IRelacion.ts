import { Observable } from "rxjs";
import { DatosServiceService } from "src/app/Services/datos-service.service";
import { ModelResponse } from "../modelResponse";
import { IMov_Type, IRelacion_Mov_Types } from "../MovType/IMovType";

export interface IRelacion {

    //Metodos
    getdatos(donde:string,ent:IMov_Type,filtro: string,page:number,pagesize:number,otrofiltro:string ): Promise<Observable<ModelResponse>>;


}