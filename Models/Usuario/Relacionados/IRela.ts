import { Observable } from "rxjs";
import { IMov_Type } from "../../MovType/IMovType";
import { ModelResponse } from "../../modelResponse";


export interface IRela{
    id:number,
    nombre:string

    getdatos(ent:IMov_Type,page:number,pagesize:number,otrofiltro:string )
    : Promise<Observable<ModelResponse>>;
}