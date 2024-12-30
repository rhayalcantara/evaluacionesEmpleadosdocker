import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IPeriodo, IPeriodo_Dts } from 'src/app/Models/Periodos/IPeriodo';
import { TablesComponent } from '../../tables/tables.component';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Periodos } from 'src/app/Controllers/Periodos';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { LoadingComponent } from '../../loading/loading.component';
import { IPuesto } from 'src/app/Models/Puesto/IPuesto';
import { Empleados } from 'src/app/Controllers/Empleados';
import { IMeta, IMetaDts, IPuestoConMetas } from 'src/app/Models/Meta/IMeta';
import { Metas } from 'src/app/Controllers/Metas';
import { ChangeStateFormComponent } from '../../Forms/change-state-form/change-state-form.component';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { FormPeriodosComponent } from '../../Forms/form-periodos/form-periodos.component';
import { FormMetasComponent } from '../../Forms/form-metas/form-metas.component';

@Component({
  selector: 'app-evaluation-periods',
  standalone: true,
  imports: [FormsModule, TablesComponent, 
    CommonModule, MatDialogModule, 
    ChangeStateFormComponent,ReactiveFormsModule],
  templateUrl: './evaluation-periods.component.html',
  styleUrls: ['./evaluation-periods.component.css']
})
export class EvaluationPeriodsComponent implements OnInit {
  public filteredPuestosActivos: IPuesto[] = [];
  public filterText: string = '';

  // ... (existing properties)
  selectedPosition: IPuesto={
    secuencial: 0,
    descripcion: '',
    departmentSecuencial: 0,
    departamento: '',
    categoriaPuestoId: 0
  };
  fg!:FormGroup;
  campos: string[]=["name"];
  tituloslocal:string[]=["Meta"];
  term: string="";
  config: any;
  cntgoal:number=0;
  @Output() TRegistros = new EventEmitter<number>();
  actualpage: number=1;
  public periods: IPeriodo[] = [];
  public period: IPeriodo_Dts=this.Periodo.InicializaModeloDTS();
  public puestosactivos:IPuesto[]=[]
  public metas:IMeta[]=[]
  isChangeStateFormVisible: boolean = false;


  constructor(
    public Periodo: Periodos,
    private Dat:DatosServiceService,
    private ServiceComunicacion: ComunicacionService,
    private empleadoscontroller: Empleados,
    private toastr: MatDialog,
    private metascontroller: Metas
    
  ) { }
  ngOnInit(): void {
    // TODO: Fetch actual periods data from a service
    // Suggestion: Investigate if the component needs to fetch all periods or if fetching only the active one is sufficient.
    // If all periods are needed, implement a new service method to fetch them and update the component accordingly.
    this.fg= this.Dat.llenarFormGrup(this.period)
    const dialogRef = this.toastr.open(LoadingComponent, {
      width: '340px',
      height: '180px', 
    }); 

    this.empleadoscontroller.getdatos()
    
    this.empleadoscontroller.TRegistros.subscribe({
      next:(rep:number)=>{
        const puestosUnicos: IPuesto[]  = this.empleadoscontroller.arrayempleadosactivos
        .map((empleado) => (
          { secuencial: empleado.scargo, 
            descripcion: empleado.cargo,
            departmentSecuencial:empleado.sdept,
            departamento:empleado.departamento,            
            categoriaPuestoId: 0 })) // Extraemos los cargos y scargo
            .filter((value, index, self) =>
              index === self.findIndex((t) => 
                t.secuencial === value.secuencial 
              ) // Filtramos duplicados por secuencial y descripcion
        );
        this.puestosactivos=puestosUnicos
        this.filteredPuestosActivos = [...this.puestosactivos];
      }
      
     })
    
     this.Periodo.GetActivo().subscribe({
      next:(rep:IPeriodo_Dts)=>{

        if(rep.activa==true){
            this.mostrarpantalla(rep)
        }else{
          //llama al formulario periodos
           
    
          const dialogRef = this.toastr.open(FormPeriodosComponent, {
            width: '800px',
            data: { model:rep }
          });
          dialogRef.afterClosed().subscribe((repx: IPeriodo) => {            
            this.Dat.showMessage("Registro Insertado Correctamente", "Periodos Evaluacion", "success");
            this.mostrarpantalla(rep)
          });
        }
        dialogRef.close()
      }
    })
  }
  filterPuestos() {
    this.filteredPuestosActivos=[]
    if (this.filterText != ''){
      this.filteredPuestosActivos = this.puestosactivos.filter(puesto =>
        puesto.descripcion.toLowerCase().includes(this.filterText.toLowerCase())
      );     
    }else{
      this.filteredPuestosActivos = [...this.puestosactivos];
    }

  }
  mostrarpantalla(rep:IPeriodo_Dts){
    console.log(rep)
    this.period=rep
    this.config = {
      id:'',
      itemsPerPage: 10,
      currentPage: 1,
      totalItems: this.period.goals.length
    };
    console.log('La Configuracion',this.config)
    this.ServiceComunicacion.enviarMensaje(this.config)
    console.log('Metas del periodo',this.period.goals)
    const puestosUnicos = this.getUniquePositions(this.period.goals)
    console.log('Puestos',puestosUnicos)
    // obtenar las metas
    this.metascontroller.getmetasperiodo(this.period.id).subscribe({
      next:((rep)=>{
        // obtener los puestos sin duplicados de las metas del periodo que esta en la variable rep
        const uniquePositions = this.getUniquePositions(rep);
          this.cntgoal = uniquePositions.length;        

      })
    })
    
  }

  // ... (existing methods)

  showChangeStateForm(): void {
    this.isChangeStateFormVisible = true;
  }

  hideChangeStateForm(): void {
    this.isChangeStateFormVisible = false;
  }

  changeState(): void {
    if(this.period.estadoid==2 && 
      this.cntgoal==this.puestosactivos.length
      
    ){
      this.showChangeStateForm();
    }
    this.Dat.showMessage("No Todos Los Puestos tiene Metas",
                         "Pase Etapa","info")
     this.showChangeStateForm();                    
    
  }

  handleFormClosed(): void {
    this.hideChangeStateForm();
    this.Dat.showMessage("El Estado Cambio Satifactoriamente","Cambio de Estados","susses")
    this.refreshActivePeriod();
  }

  refreshActivePeriod(): void {
    this.Periodo.GetActivo().subscribe({
      next: (rep: IPeriodo_Dts) => {
        this.period = rep;
        this.updateConfig();
        console.log('Active period refreshed:', this.period);
      },
      error: (error) => {
        console.error('Error refreshing active period:', error);
      }
    });
  }

  updateConfig(): void {
    this.config = {
      id: '',
      itemsPerPage: 10,
      currentPage: 1,
      totalItems: this.period.goals.length
    };
    this.ServiceComunicacion.enviarMensaje(this.config);
  }
  getUniquePositions(metaDtsArray:IMetaDts[]):IPuesto[] {
    // Extraer las posiciones
    const positions = metaDtsArray.map(item => item.position);
    
    // Eliminar duplicados usando Set
    const uniquePositions = this.getUniquePuestos(positions);
    
    return uniquePositions;
  }
  
  getUniquePuestos(puestosArray:IPuesto[]) {
    const uniqueMap = new Map();
    
    puestosArray.forEach(puesto => {
      const key = `${puesto.secuencial}-${puesto.departmentSecuencial}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, puesto);
      }
    });
    
    return Array.from(uniqueMap.values());
  }
  actualizaelidtable($event: string) {

  }
  paginacambio($event: number) {
  
  }
  opcion($event: TableResponse) {
    const  dialogRef = this.toastr.open(FormMetasComponent,{
      width: '800px',data:{model:$event.key}})
      dialogRef.afterClosed().subscribe((rep:IMetaDts )=>{
        //console.log('llego del formulario de Meta ',result)
      }); 
  }
  fetchGoalsForPosition(positionId: number) {
    console.log('buscando las metas',positionId,this.period)
    this.metascontroller.GetMetasPorPeriodoYPuesto(this.period.id,positionId)
      .subscribe((rep:IMeta[])=>{
        console.log('las metas',rep)
        this.metas=rep
        this.config = {
          id:'',
           itemsPerPage: 10,
           currentPage: 1,
           totalItems: this.metas.length
         };
         this.ServiceComunicacion.enviarMensaje(this.config)
      })
  }
  selectPosition(_t28: IPuesto) {
    this.selectedPosition=_t28
    this.fetchGoalsForPosition(this.selectedPosition.secuencial)
  }
  activatePeriod(period: IPeriodo): void {
    if (confirm(`Are you sure you want to activate ${period.descripcion}?`)) {
      period.activa = true;
      period.estadoid = 2;
      // TODO: Update the period in the backend
      // Suggestion: Implement the backend update logic within the `activatePeriod` function.
      // This would likely involve calling a service method to send the updated period data to the server.
      console.log(`Period ${period.descripcion} activated and set to Configurando state`);
    }
  }

 

  private isValidTransition(currentState: string, newState: string): boolean {
    const validTransitions: { [key: string]: string[] } = {
      'Inactiva': ['Configurando'],
      'Configurando': ['Evaluando'],
      'Evaluando': ['Calculando'],
      'Calculando': ['Cerrada'],
      'Cerrada': []
    };

    return validTransitions[currentState]?.includes(newState) || false;
  }
  // ... (rest of the existing code)

  contarPuestosConMetasPorPeriodo(metas: IMeta[]): IPuestoConMetas[] {
    // Paso 1: Agrupar metas por periodo y puesto
    const metasPorPeriodoYPuesto = metas.reduce((acc, meta) => {
      const key = `${meta.periodId}-${meta.positionSecuencial}`;
      if (!acc[key]) {
        acc[key] = { periodId: meta.periodId, positionSecuencial: meta.positionSecuencial };
      }
      return acc;
    }, {} as Record<string, { periodId: number; positionSecuencial: number }>);
  
    // Paso 2: Contar puestos únicos por periodo
    const puestosPorPeriodo = Object.values(metasPorPeriodoYPuesto).reduce((acc, item) => {
      if (!acc[item.periodId]) {
        acc[item.periodId] = 0;
      }
      acc[item.periodId]++;
      return acc;
    }, {} as Record<number, number>);
  
    // Paso 3: Formatear el resultado
    return Object.entries(puestosPorPeriodo).map(([periodId, cantidadPuestos]) => ({
      periodId: Number(periodId),
      cantidadPuestos
    }));
  }

}
