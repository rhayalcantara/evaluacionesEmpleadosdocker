import { Injectable } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { Empleados } from "./Empleados";

@Injectable({
    providedIn: 'root'
  })
  export class EmpleadosFactory {
    constructor(private datosService: DatosServiceService) {}
  
    crear(): Empleados {
      return new Empleados(this.datosService);
    }
  }
  