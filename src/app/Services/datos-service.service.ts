import { HttpClient, HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { ModelResponse } from '../Models/Usuario/modelResponse';
import { FotoPadron } from '../Helpers/Interfaces';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class DatosServiceService {

  public URL: string = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) { }
   headers:HttpHeaders = new HttpHeaders({    
    'Content-Type': 'application/json; charset=utf-8' 
  });
    //Archivo
    public Uploadfile(file: File,expedienteid:string,descripcion:string): Observable<HttpEvent<any>>{
      // console.log('en el servicio',file,expedienteid,descripcion )
      const formData: FormData = new FormData();
        formData.append('files', file);
       
        const req = new HttpRequest('POST',  this.URL+`/api/Documentoes/doc/?expedienteclienteid=${expedienteid}&descripcion=${descripcion}`, formData, {
          reportProgress: true,
          responseType: 'json'
        });
        return this.http.request(req);
      }
  public showMessage(message: string, title: any, messageType: string) {
    switch (messageType) {
      case 'success':

        Swal.fire({
          title: title,
          text: message,
          icon: 'success',
          confirmButtonText: 'Cool'
        })
        break;
       case 'info':
      
      
         Swal.fire({
          title: title,
          text: message,
          icon: 'info',
          confirmButtonText: 'ok'
        })
         break;
       case 'error':
     //    this.toastr.error(message, title);
          Swal.fire({
            title: title,
            text: message,
            icon: 'error',
            confirmButtonText: 'ok'
          })
              break;
       case 'warning':
     //    this.toastr.warning(message, title);
        Swal.fire({
          title: title,
          text: message,
          icon: 'warning',
          confirmButtonText: 'ok'
        })
        break;
    }
   }
   public getdocumentofile(id:number){
    return this.http.get(this.URL + `/api/Documentoes/files/${id}`, {
      reportProgress: true,
      responseType: 'blob',
  });
      
  }

  public GetFotouser(identificacion:string): Observable<FotoPadron[]>{
    return this.http.get<FotoPadron[]>(`${environment.fotoPadronUrl}/api/FotoPadron?identificacion=${identificacion}`)
  }

   public llenarFormGrup<T>(obj:any):FormGroup {
         
         
        let  campos:string[] = Object.keys(obj)
        // console.log('los campos',campos)
        let formGroup:FormGroup=new FormGroup({})
         for (let control of campos) {
           
          // if(control == 'relacionadomt' ){
          /*  if (typeof(obj[control])=='object' && Object.prototype.toString.call(obj[control])!='[object Date]' ){
            let incampos = Object.keys(obj[control])

            for (let incontrol of incampos){
    
              let newFormControl: FormControl = new FormControl();      
              newFormControl.setValue(obj[control][incontrol]);
              formGroup.addControl(control+"."+incontrol, newFormControl);
            }
    
          }else{*/
            let newFormControl: FormControl = new FormControl();      
            newFormControl.setValue(obj[control]);
            formGroup.addControl(control, newFormControl);
            //console.log({campo:control,fg:newFormControl.value})
          //}

        } 
       
        return formGroup
   }
 
   public insertardatos<T>(url:string,obj:T):Observable<T>{
  
    return this.http.post<T>(url, JSON.stringify(obj), { headers:this.headers } );
   }
   public updatedatos<T>(url:string,obj:T):Observable<T>{
   
    return this.http.put<T>(url, JSON.stringify(obj), { headers:this.headers } )
   }
   public getdatos<T>(url:string):Observable<ModelResponse>{
    return this.http.get<ModelResponse>(url)
   }
   public getdatoscount(url:string):Observable<number>{
    return this.http.get<number>(url)
   }

   public getbyid<T>(url:string):Observable<T>{
    return this.http.get<T>(url)
   }
   public delbyid<T>(url:string):Observable<T>{
     this.logger.debug('Eliminando recurso', { url });
    return this.http.delete<T>(url)
   }
}


