import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ExcelService } from "../Services/excel.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { defer, firstValueFrom, map, Observable } from 'rxjs';
import { IMeta, IMetadto, IMetaDts,
         IResultadoLoteMetas, IReferenciaClonadoMetas,
         IPrevisualizacionClonadoMetas, IResumenMetasPuesto } from "../Models/Meta/IMeta";
import { LoggerService } from "../Services/logger.service";
import { Meta } from "@angular/platform-browser";
import { IPeriodo } from "../Models/Periodos/IPeriodo";
import { IPuesto } from "../Models/Puesto/IPuesto";
import { IGrupoCompetencia } from "./GrupoCompetencia";
import { IObjetivo } from "../Models/Objetivo/IObjetivo";


@Injectable({
    providedIn: 'root'
  })

  export class Metas implements OnInit{

      rutaapi:string =this.datos.URL+'/api/Goals'
      titulomensage:string='Metas'      
       public model:IMeta = this.inicializamodelo()
       public titulos=[{periodo:'Periodo'},
                       {departamento:"Departamento"},
                       {puesto:"Puesto"},
                       {objj:"Competencia"},
                       {name:'Descripcion'},
                       {weight:'Peso'}]

       public estado:string='`'
       public totalregistros:number=0
       public actualpage:number=1
       public pagesize:number=10
       public filtro:string=''
       public arraymodel:IMetaDts[]=[]
       

       public operationSuccessful: boolean = false;
       @Output() TRegistros = new EventEmitter<number>();

    constructor(
        private datos:DatosServiceService,
        public datosMeta:Meta,
        private logger:LoggerService

       ){}
    ngOnInit(): void {
        this.filtro=""
        this.estado=""
        this.actualpage=1
        this.pagesize=10
        this.getdatos()
    }

  
    public inicializamodeloDts():IMetaDts{

      return {
        id: 0,
        name: '',
        periodId:0,
        weight:1,
        positionSecuencial:0,
        puesto:"",
        departamento:"",
        periodo:"",
        position:{
          secuencial: 0,
          descripcion: "",
          departmentSecuencial: 0,
          departamento: "",
          categoriaPuestoId: 0
        },
        objetivoid:0,
        objj:"",
        objetivo:{
          id: 0,
          grupoCompetenciaId: 0,
          nombre: "",
          descripcion: "",
          periodoId: 0,
          estadoId: 0,
          fecha: "",
          grupoCompetencia:{
            id: 0,
            nombre: ""
          }
        }
      } 
      
    }
    public inicializamodelo():IMeta{

      return {
        id: 0,
        name: '',
        periodId:0,
        weight:1,
        positionSecuencial:0,
        objetivoid:0
      } 
      
    }
    public  getdatos(){
  

         this.Gets()        
           .subscribe({        
          next:(rep:ModelResponse)=>{            
            this.totalregistros =  rep.count
            this.arraymodel=[]
            this.arraymodel=rep.data    
            this.TRegistros.emit(this.totalregistros)        
          }
        }
        ) 
    }
    public getmetasperiodo(periodoid:number):Observable<IMetaDts[]>{
      
      return this.datos.getdatos<ModelResponse>( this.rutaapi+`/periodo/?periodoid=${periodoid}`)
      .pipe(
        map((response: ModelResponse) => {
          if (response.exito === 200 && Array.isArray(response.data)) {
            return response.data as IMetaDts[];
          } else {
            throw new Error(response.mensaje || 'Error retrieving data');
          }
        })
      );
    }
    public GetMetasPorPeriodoYPuesto(periodoid:number,puestosecuencial:number):Observable<IMetaDts[]>{
      //obtiene todas las metas
      return this.Gets().pipe(
        map((rep: ModelResponse) => {
          let metas: IMetaDts[] = rep.data;
          return metas.filter(x => x.periodId == periodoid && x.positionSecuencial == puestosecuencial);
        })
      );
    }
    public getObjetivos(): Observable<IObjetivo[]> {
      return this.datos.getdatos<ModelResponse>(this.datos.URL + '/api/GrupoCompetencias').pipe(
        map((response: ModelResponse) => response.data as IObjetivo[])
      );
    }
    public filtrar(){
        this.Gets().subscribe(
                        (m:ModelResponse)=>{
                         
                          this.totalregistros =  m.count
                          this.TRegistros.emit(this.totalregistros)        
                          
                          this.arraymodel=[]
                          this.arraymodel=m.data
                        }
                      )
          
    }
    
    
      public Gets():Observable<ModelResponse> {
        return this.datos.getdatos<ModelResponse>( this.rutaapi)
      }

  
      public Get(id:string):Observable<IMeta>{
          return this.datos.getbyid<IMeta>(this.rutaapi+`/${id}`)
      }
      public GetCount():Observable<number>{
        
        return this.datos.getdatoscount(this.rutaapi+`/count`)
      }
  
      public insert(obj:IMeta):Observable<IMetadto>{  
        let m:IMetadto ={
          id: obj.id,
          name: obj.name,
          periodId: obj.periodId,
          weight: obj.weight,
          positionSecuencial: obj.positionSecuencial,
          objetivoid: obj.objetivoid
        }
        return this.datos.insertardatos<IMetadto>(this.rutaapi, m ); 
      }
      public Update(obj:IMeta):Observable<IMeta>{
        return this.datos.updatedatos<IMeta>(this.rutaapi+`/${obj.id}`,obj);
      }

      /**
       * Elimina una meta: DELETE /api/Goals/{id}.
       * El API responde 204 (sin cuerpo) cuando borra y 404 si el id no existe.
       */
      public Delete(id:number):Observable<any>{
        this.logger.debug('Metas: eliminando meta', { id });
        return this.datos.delbyid<any>(this.rutaapi+`/${id}`);
      }

      // ── Asimetria objetivoId / objetivoid ─────────────────────────────────────
      // Al LEER, el API devuelve el campo como "objetivoId" (Goal_Dts.ObjetivoId
      // serializado en camelCase), pero las interfaces del frontend y el POST usan
      // "objetivoid" todo en minusculas (el model binding de .NET no distingue
      // mayusculas al escribir, pero al leer hay que usar el nombre real).
      // Documentado en scripts/clonar_goals_gh_p7_a_p8.py.
      /**
       * Devuelve el id de la competencia de una meta sin importar si viene
       * de una lectura del API (objetivoId) o de un modelo del frontend (objetivoid).
       */
      public objetivoDe(meta:any):number{
        if (meta == null) { return 0; }
        return Number(meta.objetivoId ?? meta.objetivoid ?? 0) || 0;
      }

      /**
       * Normaliza la descripcion de una meta para comparar duplicados:
       * mayusculas y sin espacios en los extremos.
       */
      private normalizarDescripcion(texto:any):string{
        return (texto ?? '').toString().trim().toUpperCase();
      }

      /**
       * Clave de duplicado de una meta: puesto + competencia + descripcion normalizada.
       */
      private claveMeta(puestoSecuencial:number, objetivoId:number, descripcion:any):string{
        return `${puestoSecuencial}|${objetivoId}|${this.normalizarDescripcion(descripcion)}`;
      }

      /**
       * Prepara una fila para escritura: id en 0 (alta) y el campo "objetivoid"
       * que espera el POST, tomando el valor venga como venga.
       */
      private aPayloadDeAlta(meta:any, periodoId?:number, puestoSecuencial?:number):IMeta{
        return {
          id: 0,
          name: (meta?.name ?? '').toString(),
          periodId: periodoId ?? Number(meta?.periodId ?? 0),
          weight: Number(meta?.weight ?? 0),
          positionSecuencial: puestoSecuencial ?? Number(meta?.positionSecuencial ?? 0),
          objetivoid: this.objetivoDe(meta)
        };
      }

      /**
       * Texto de error legible para el reporte del lote.
       */
      private describirError(meta:IMeta, err:any):string{
        const detalle = err?.error?.mensaje
                     ?? err?.error?.title
                     ?? (typeof err?.error === 'string' ? err.error : null)
                     ?? err?.message
                     ?? 'Error desconocido';
        return `Puesto ${meta.positionSecuencial} - competencia ${meta.objetivoid} - "${meta.name}": ${detalle}`;
      }

      /**
       * Alta multiple de metas, una tras otra.
       * Si una fila falla NO se aborta el lote: se cuenta como fallida, se guarda
       * el mensaje del API y se sigue con la siguiente.
       */
      public insertarLote(metas:IMeta[]):Observable<IResultadoLoteMetas>{
        return defer(async () => {
          const resultado:IResultadoLoteMetas = { creadas: 0, fallidas: 0, errores: [] };

          if (!metas || metas.length === 0){
            this.logger.debug('Metas: alta en lote sin filas que procesar');
            return resultado;
          }

          for (const meta of metas){
            // se normaliza aqui porque la fila puede venir de una lectura del API
            const payload = this.aPayloadDeAlta(meta);
            try{
              await firstValueFrom(this.insert(payload));
              resultado.creadas++;
            }catch(err:any){
              resultado.fallidas++;
              resultado.errores.push(this.describirError(payload, err));
              this.logger.error('Metas: fallo al insertar una meta del lote',
                                err instanceof Error ? err : undefined,
                                { puesto: payload.positionSecuencial, periodo: payload.periodId, nombre: payload.name });
            }
          }

          this.logger.info('Metas: alta en lote finalizada',
                           { total: metas.length, creadas: resultado.creadas, fallidas: resultado.fallidas });
          return resultado;
        });
      }

      /**
       * Previsualiza el clonado de metas de un periodo/puesto a otro.
       * No escribe nada: devuelve las filas que se crearian (aCrear) y las que se
       * saltarian por existir ya en el destino (duplicadas), comparando por
       * puesto destino + competencia + descripcion normalizada.
       *
       * Si el destino trae puestoSecuencial, todas las filas se reasignan a ese
       * puesto; si no, cada fila conserva su puesto de origen y solo cambia el periodo.
       *
       * LIMITACION IMPORTANTE (no se puede resolver desde el frontend):
       * el indice de duplicados se arma con GET /api/Goals, y ese endpoint hace un
       * join con Deparments, de modo que NO devuelve los goals de puestos cuyo
       * Departmentsecuencial es 0 (puesto huerfano en el core RRHH). Caso real
       * documentado en scripts/clonar_goals_gh_p7_a_p8.py (lineas 41-52): el puesto
       * 19, GERENTE GESTION HUMANA, tiene 12 goals en BD (ids 11233-11244) que el
       * API no lista. Si filas asi ya existen en el destino, esta previsualizacion
       * las da por inexistentes, las reporta en aCrear y ejecutarClonado las inserta
       * DUPLICADAS de verdad. Por eso la garantia de "nunca duplica" solo vale para
       * lo que el API deja ver; los puestos invisibles se reportan en
       * IPrevisualizacionClonadoMetas.advertencias para que el usuario decida antes
       * de ejecutar, y la unica verificacion concluyente es por SQL.
       */
      public previsualizarClonado(origen:IReferenciaClonadoMetas,
                                  destino:IReferenciaClonadoMetas):Observable<IPrevisualizacionClonadoMetas>{
        return this.Gets().pipe(
          map((rep:ModelResponse) => {
            const todas:IMetaDts[] = Array.isArray(rep?.data) ? rep.data : [];

            const filasOrigen = todas.filter(m =>
              m.periodId === origen.periodoId &&
              (origen.puestoSecuencial == null || m.positionSecuencial === origen.puestoSecuencial)
            );

            // Punto ciego del API: los puestos con departamento huerfano no salen en
            // GET /api/Goals aunque tengan metas en BD. Si el puesto pedido no aparece
            // en NINGUNA fila del listado, se avisa en vez de callarlo.
            const advertencias = this.detectarPuestosInvisibles(todas, origen, destino);

            // indice de lo que ya existe en el periodo destino
            const yaExiste = new Set<string>(
              todas.filter(m => m.periodId === destino.periodoId)
                   .map(m => this.claveMeta(m.positionSecuencial, this.objetivoDe(m), m.name))
            );

            const aCrear:IMeta[] = [];
            const duplicadas:IMeta[] = [];

            const ordenadas = [...filasOrigen].sort((a, b) =>
              a.positionSecuencial - b.positionSecuencial ||
              this.normalizarDescripcion(a.name).localeCompare(this.normalizarDescripcion(b.name))
            );

            for (const fila of ordenadas){
              const puestoDestino = destino.puestoSecuencial ?? fila.positionSecuencial;
              const candidata = this.aPayloadDeAlta(fila, destino.periodoId, puestoDestino);
              const clave = this.claveMeta(puestoDestino, candidata.objetivoid, candidata.name);

              if (yaExiste.has(clave)){
                duplicadas.push(candidata);
              }else{
                aCrear.push(candidata);
                // se marca para que varios puestos de origen colapsados en un mismo
                // puesto destino no generen la misma fila dos veces
                yaExiste.add(clave);
              }
            }

            this.logger.info('Metas: previsualizacion de clonado',
                             { origen, destino, encontradas: filasOrigen.length,
                               aCrear: aCrear.length, duplicadas: duplicadas.length,
                               advertencias: advertencias.length });

            if (advertencias.length > 0){
              this.logger.warn('Metas: la previsualizacion de clonado tiene puntos ciegos', advertencias);
            }

            return { aCrear, duplicadas, advertencias };
          })
        );
      }

      /**
       * Detecta si el puesto de origen o el de destino no aparecen en el listado que
       * devuelve el API. Un puesto ausente significa que el join con Deparments lo
       * excluyo (Departmentsecuencial = 0) o que simplemente no tiene metas en ningun
       * periodo; desde el frontend no se pueden distinguir los dos casos, y en el
       * primero la comprobacion de duplicados deja de ser fiable.
       */
      private detectarPuestosInvisibles(todas:IMetaDts[],
                                        origen:IReferenciaClonadoMetas,
                                        destino:IReferenciaClonadoMetas):string[]{
        const advertencias:string[] = [];
        const puestosVisibles = new Set<number>(todas.map(m => m.positionSecuencial));

        if (origen.puestoSecuencial != null && !puestosVisibles.has(origen.puestoSecuencial)){
          advertencias.push(
            `El puesto de origen ${origen.puestoSecuencial} no aparece en el listado de /api/Goals. ` +
            `Puede que no tenga metas en ningun periodo, o que las tenga en base de datos pero el API ` +
            `las oculte por tener el departamento en 0 (puesto huerfano). En ese caso no hay nada que clonar ` +
            `desde aqui y hay que verificarlo por SQL.`
          );
        }

        if (destino.puestoSecuencial != null && !puestosVisibles.has(destino.puestoSecuencial)){
          advertencias.push(
            `El puesto de destino ${destino.puestoSecuencial} no aparece en el listado de /api/Goals, ` +
            `asi que NO se puede confirmar que no tenga ya metas en el periodo destino. Si las tiene ` +
            `(caso de los puestos con departamento en 0), ejecutar el clonado las duplicaria. ` +
            `Verifique por SQL antes de continuar.`
          );
        }

        return advertencias;
      }

      /**
       * Ejecuta el clonado con las filas aprobadas en la previsualizacion.
       * Es el alta multiple: no aborta el lote si una fila falla.
       */
      public ejecutarClonado(aCrear:IMeta[]):Observable<IResultadoLoteMetas>{
        this.logger.info('Metas: ejecutando clonado', { filas: aCrear?.length ?? 0 });
        return this.insertarLote(aCrear ?? []);
      }

      /**
       * Suma de los pesos de las metas de un puesto en un periodo.
       * Sirve para el semaforo de peso (100 = correcto).
       *
       * OJO CON EL RENDIMIENTO: se apoya en GetMetasPorPeriodoYPuesto, que descarga
       * GET /api/Goals completo y filtra en el cliente. Es para consultar UN puesto
       * puntual (por ejemplo tras editar sus metas). Para pintar el semaforo de un
       * listado use resumenPorPuesto(periodoId), que resuelve todos los puestos del
       * periodo en una sola llamada; llamar a este metodo por cada fila bajaria la
       * tabla entera tantas veces como puestos haya.
       */
      public pesoTotalPorPuesto(periodoId:number, puestoSecuencial:number):Observable<number>{
        return this.GetMetasPorPeriodoYPuesto(periodoId, puestoSecuencial).pipe(
          map((metas:IMetaDts[]) =>
            (metas ?? []).reduce((suma, m) => suma + (Number(m.weight) || 0), 0))
        );
      }

      /**
       * Resumen por puesto de las metas de un periodo (agrupado en el cliente
       * a partir de /api/Goals/periodo), para alimentar el semaforo de peso.
       */
      public resumenPorPuesto(periodoId:number):Observable<IResumenMetasPuesto[]>{
        return this.getmetasperiodo(periodoId).pipe(
          map((metas:IMetaDts[]) => {
            const agrupado = new Map<number, IResumenMetasPuesto>();

            for (const meta of (metas ?? [])){
              const puestoSecuencial = Number(meta.positionSecuencial) || 0;
              let fila = agrupado.get(puestoSecuencial);

              if (!fila){
                fila = {
                  puestoSecuencial: puestoSecuencial,
                  puesto: (meta.puesto ?? meta.position?.descripcion ?? '').toString(),
                  departamento: (meta.departamento ?? meta.position?.departamento ?? '').toString(),
                  cantidad: 0,
                  pesoTotal: 0
                };
                agrupado.set(puestoSecuencial, fila);
              }

              fila.cantidad++;
              fila.pesoTotal += (Number(meta.weight) || 0);
            }

            return Array.from(agrupado.values()).sort((a, b) =>
              a.departamento.localeCompare(b.departamento) || a.puesto.localeCompare(b.puesto)
            );
          })
        );
      }

      public Reporte(){}
      
      public exportexcel(){}
              
      public async grabar(): Promise<boolean> {
        // Envuelve el código en una nueva Promise       
        return new Promise<boolean>(async (resolve) => {
          if (this.model.id == 0) {
            // inserta el registro
            await firstValueFrom(this.insert(this.model)).then(
              (rep: IMetadto) => {
                firstValueFrom(this.Get(rep.id.toString())).then(t=>{
                  this.model = t
                })
                //this.model = rep;
                this.datos.showMessage('Registro Insertado Correctamente', this.titulomensage, "success");                
                resolve(true); // Devuelve true si la operación fue exitosa
              },
              (err: Error) => {
                this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error');
                resolve(false); // Devuelve false si la operación falló
              }
            );
          } else {
          // actualiza el registro            
            await firstValueFrom(this.Update(this.model)).then(
              (rep: IMeta) => {                
                this.model = rep;            
                this.TRegistros.emit(this.totalregistros)
                resolve(true); // Devuelve true si la operación fue exitosa
              },
              (err: Error) => {
                this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error');
                resolve(false); // Devuelve false si la operación falló
              }
            );
          }
        });
      }
  }
