import { EventEmitter, Injectable, OnInit, Output } from '@angular/core';
import { DatosServiceService } from '../Services/datos-service.service';
import { IConsejalClave } from '../Models/Consejal/Iconsejal'; // Importar IConsejalClave
import { ModelResponse } from '../Models/Usuario/modelResponse';
import { Observable } from 'rxjs';
import { UtilsService } from '../Helpers/utils.service';

@Injectable({
  providedIn: 'root'
})
export class ConsejalClaveController implements OnInit { // Cambiar nombre de clase
  rutaapi: string = this.datos.URL + '/api/Consejal_Clave'; // Ajustar ruta API
  titulomensage: string = 'Consejal Clave'; // Ajustar título
  public arraytotal: IConsejalClave[] = [];
  public model: IConsejalClave = this.inicializamodelo();

  // Ajustar títulos según las propiedades de IConsejalClave
  titulos = [
    { id: 'ID' },
    { consejalId: 'ID Consejal' },
    { usuario: 'Usuario' },
    // No incluir 'password' en la tabla por seguridad
    { consejal: 'Consejal Asociado' } // Si se desea mostrar info del consejal
  ];

  public estado: string = '`'; // Mantener si es necesario para filtros
  public totalregistros: number = 0;
  public actualpage: number = 1;
  public pagesize: number = 10; // Ajustar tamaño de página si es necesario
  public filtro: string = '';
  public arraymodel: IConsejalClave[] = [];

  public operationSuccessful: boolean = false;
  @Output() TRegistros = new EventEmitter<number>();

  constructor(
    private datos: DatosServiceService
  ) { }

  ngOnInit(): void {
    this.filtro = "";
    this.estado = ""; // O el estado inicial deseado
    this.actualpage = 1;
    this.pagesize = 10;
    // Considerar si se debe llamar a getdatos() al iniciar
    // this.getdatos();
  }

  public inicializamodelo(): IConsejalClave {
    return {
      id: 0,
      consejalId: 0,
      usuario: '',
      password: '', // Inicializar vacío, manejar con cuidado
      consejal: null // O undefined, según la definición
    };
  }

  public getdatos() {
    this.arraymodel = [];
    this.Gets().subscribe({
      next: (rep: ModelResponse) => {
        this.totalregistros = rep.count;
        this.arraymodel = rep.data as IConsejalClave[]; // Castear a IConsejalClave
        this.arraytotal = rep.data as IConsejalClave[];

        // Ordenar si es necesario, por ejemplo por usuario
        if (this.arraymodel) {
          this.arraymodel.sort((a, b) => a.usuario.localeCompare(b.usuario));
        }

        this.TRegistros.emit(this.totalregistros);
      },
      error: (err) => {
        console.error('Error fetching ConsejalClave data:', err);
        // Manejar el error apropiadamente (e.g., mostrar mensaje al usuario)
        this.operationSuccessful = false;
      }
    });
  }

  public Gets(): Observable<ModelResponse> {
    // Construir URL con parámetros de paginación y filtro si la API los soporta
    // Ejemplo: const url = `${this.rutaapi}?page=${this.actualpage}&pageSize=${this.pagesize}&filter=${this.filtro}&status=${this.estado}`;
    const url = this.rutaapi; // URL base por ahora
    // console.log('Requesting data from:', url);
    return this.datos.getdatos<ModelResponse>(url);
  }

  public Get(id: string): Observable<IConsejalClave> {
    const url = `${this.rutaapi}/${id}`;
    // console.log('Requesting single ConsejalClave from:', url);
    return this.datos.getbyid<IConsejalClave>(url);
  }
  public Getconsejalid(id: string): Observable<IConsejalClave> {
    const url = `${this.rutaapi}/consejal/${id}`;
    // console.log('Requesting single ConsejalClave from:', url);
    return this.datos.getbyid<IConsejalClave>(url);
  }
  // --- Métodos específicos de Empleados eliminados ---
  // getsubordinados
  // Getsub
  // GetByCedula
  // GetByUsuario

  // GetCount podría mantenerse si la API lo soporta para ConsejalClave
  public GetCount(): Observable<number> {
    const url = `${this.rutaapi}/count`;
    // console.log('Requesting count from:', url);
    return this.datos.getdatoscount(url);
  }

  // Métodos para Crear, Actualizar y Eliminar
  public Create(data: IConsejalClave): Observable<IConsejalClave> {
    return this.datos.insertardatos<IConsejalClave>(this.rutaapi, data);
  }

  public Update(id: string, data: IConsejalClave): Observable<IConsejalClave> {
    return this.datos.updatedatos<IConsejalClave>(`${this.rutaapi}/${id}`, data);
  }

  public Delete(id: string): Observable<IConsejalClave> {
    return this.datos.delbyid<IConsejalClave>(`${this.rutaapi}/${id}`);
  }

  // Método para buscar por ConsejalId
  public GetByConsejalId(consejalId: number): Observable<IConsejalClave> {
    return this.datos.getbyid<IConsejalClave>(`${this.rutaapi}/consejal/${consejalId}`);
  }

  // Método genérico para guardar (crear o actualizar)
  public Save(data: IConsejalClave): Observable<IConsejalClave> {
    if (data.id === 0) {
      return this.Create(data);
    } else {
      return this.Update(data.id.toString(), data);
    }
  }
}
