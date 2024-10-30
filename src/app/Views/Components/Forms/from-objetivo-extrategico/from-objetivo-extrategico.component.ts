import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Form, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ObjetivoEstrategico } from 'src/app/Controllers/ObjetivoEstrategico';
import { PlanExtrategico } from 'src/app/Controllers/PlanExtrategico';
import { IObjetivoEstrategico, IObjetivoExtrategicoAno, IPlan_Anos, IPlanExtrategico } from 'src/app/Models/PlanExtrategico/IPlanExtrategico';
import { Perspectiva } from 'src/app/Controllers/Perspectiva';
import { IPerspectiva } from 'src/app/Models/Perspectiva/IPerspectiva';
import { PlanAnos } from 'src/app/Controllers/PlanAnos';
import { ObjetivoExtrategicoAno } from 'src/app/Controllers/ObjetivoExtrategicoAno';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';

@Component({
  selector: 'app-from-objetivo-extrategico',
  templateUrl: './from-objetivo-extrategico.component.html',
  styleUrls: ['./from-objetivo-extrategico.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule,ReactiveFormsModule]
})
export class FromObjetivoExtrategicoComponent implements OnInit {
objetivosPorAnos:IObjetivoExtrategicoAno[]=[] ;


  public planesEstrategicos: IPlanExtrategico[] = [];
  public perpectiva:IPerspectiva[]=[]
  public plananos:IPlan_Anos[]=[]
  public planExtrategicoModelId:number=0;
  public perspectivaId : number = 0;

  public Formgrup:FormGroup 
  constructor(
    private datosService: DatosServiceService,
    private fb:FormBuilder,
    public objetivoEstrategicoService: ObjetivoEstrategico,
    private planestrategicocontroller:PlanExtrategico,
    private PrespectivasController:Perspectiva,
    private plananosController:PlanAnos,
    private objetivoestragicoAno: ObjetivoExtrategicoAno,
    public dialogRef: MatDialogRef<FromObjetivoExtrategicoComponent>,
    private cd: ChangeDetectorRef, 
    private ServiceComunicacion: ComunicacionService,
    @Inject(MAT_DIALOG_DATA) public data: { model: IObjetivoEstrategico }
  ) {
    this.objetivoEstrategicoService.model=this.objetivoEstrategicoService.inicializamodelo()
    this.Formgrup = this.fb.group({
      descripcion:[this.objetivoEstrategicoService.model.descripcion, Validators.required],
      planExtrategicoModelId: [this.planExtrategicoModelId, Validators.required],
      perspectivaId: [this.perspectivaId, Validators.required],
      objetivosPorAnos: this.fb.array([])
    })
    this.ServiceComunicacion.enviarMensajeObservable.subscribe({
      next: (mensaje: string) => {
        console.log('estadoServices Constructor: ' + mensaje);
      }
    });
  }

  ngOnInit(): void {
    this.planestrategicocontroller.TRegistros.subscribe(
      {next: (data:number) =>{
       
        this.planesEstrategicos = this.planestrategicocontroller.arraymodel
        this.cd.detectChanges() 
      }

      })
    this.plananosController.TRegistros.subscribe(
      {next: (data:number) =>{
        
        //this.plananos = this.plananosController.arraymodel
        this.cd.detectChanges() 
      }

      })
    this.PrespectivasController.TRegistros.subscribe(
      {next: (data:number) =>{
        
        // this.perpectiva = this.PrespectivasController.arraymodel
        this.cd.detectChanges() 
      }

      })
    //Cargar los planes
    this.planestrategicocontroller.getdatos()
    console.log('la data que llego',this.data)

    this.objetivoEstrategicoService.model = this.data.model
    if(this.objetivoEstrategicoService.model.id!=0){
      //editando
      this.Formgrup.controls['descripcion'].setValue(this.objetivoEstrategicoService.model.descripcion);
      // buscar la perspectiva 
      this.PrespectivasController.Get(this.objetivoEstrategicoService.model.perspectivaId.toString()).subscribe({
        next: (perspectiva) => {
          console.log('la Perspectiva',perspectiva)
          this.objetivoEstrategicoService.model.perspectiva = perspectiva;
          this.planExtrategicoModelId = perspectiva.planExtrategicoModelId;
          this.cargarPerspectivas(perspectiva.planExtrategicoModelId,perspectiva.id);
          
          this.Formgrup.controls['planExtrategicoModelId'].setValue(this.planExtrategicoModelId);
          this.cd.detectChanges();
        },
      })

    }else{
      
    }
    //this.Formgrup.patchValue(this.objetivoEstrategicoService.model);
  }
  get objetivosFormArray() {
    return this.Formgrup.get('objetivosPorAnos') as FormArray;
  }
  crearObjetivoFormGroup() {
    return this.fb.group({
      id:[0],
      descripcion: [''],
      plan_anosid: [0],
      porcientovalor: ['Porciento'],
      valor: [0],
      inverso: [false],
      logro: [0]
    });
  }
  crearObjetivoFormGroupwithdatos (datos: IObjetivoExtrategicoAno) {
    console.log('kri',datos)
    return this.fb.group({
      id:datos.id,
      descripcion: datos.descripcion,
      plan_anosid:datos.plan_AnosId,
      porcientovalor: datos.porcientovalor,
      valor: datos.valor,
      inverso: datos.inverso,
      logro: datos.logro
    });
  }
  eliminarFila(arg0: any) {
    this.objetivosPorAnos.splice(arg0, 1);
    this.objetivosFormArray.removeAt(arg0);
}

agregarFila() {
  let obano:IObjetivoExtrategicoAno={
    id: 0,
    objetivoExtrategicoId: 0,
    plan_AnosId: 0,
    porcientovalor: '',
    valor: 0,
    inverso: false,
    logro: 0,
    objetivoEstrategico: {
      id: 0,
      perspectivaId: 0,
      descripcion: '',
      perspectiva: {
        id: 0,
        planExtrategicoModelId: 0,
        nombre: '',
        peso: 0
      }
    },
    planano: {
      id: 0,
      planExtrategicoId: 0,
      ano: ''
    },
    descripcion: ''
  }
  
  this.objetivosPorAnos.push(obano);
  this.objetivosFormArray.push(this.crearObjetivoFormGroup());
}
  onplanSelect(event: Event) {
    // cuando el plan cambia, se buscan las perspectivas de ese plan
    let planid:number = +(event.target as HTMLSelectElement).value;
    this.cargarPerspectivas(planid,0);
  }
  cargarPerspectivas(planid:number,persid:number) {
    this.PrespectivasController.GetsPlan(planid).subscribe({
      next: (data) => {
        this.perpectiva = data;
        this.perspectivaId=persid
        this.Formgrup.controls['perspectivaId'].setValue(persid);
      },
    })
    this.cargarplanano(planid)
  }
  cargarplanano(planid:number){
    //  busca los anos del plan
    this.plananosController.GetsPlan(planid).subscribe({
      next: (data) => {

        this.plananos = data;
        console.log('consiguio los anos',this.plananos)
        if(this.objetivoEstrategicoService.model.id !== 0) {
          console.log('anos activos',this.plananos)
            // buscar los objetivosPorAnos 
            this.objetivoestragicoAno.GetByObjivo(this.objetivoEstrategicoService.model.id).subscribe({
              next: (objetivos) => {
                this.objetivosPorAnos = objetivos;
                this.objetivosPorAnos.forEach(obj => {
                  this.objetivosFormArray.push(this.crearObjetivoFormGroupwithdatos(obj));                  
                });
                this.cd.detectChanges();
              },
            })

        }        
      },
    })
  }
  onSubmit() {
    //grabar 
    console.log( this.objetivoEstrategicoService.model )
  }
  cargarPlanesEstrategicos() {
    // Implementar la carga de planes estratégicos desde el servicio
    // TODO: Implement this method using PlanExtrategico service
   // this.planesEstrategicos = this.planestrategicocontroller.arraymodel
    this.planestrategicocontroller.getdatos()
    
  }

  async guardar() {
    //verificar 
    if (this.Formgrup.valid) {
    this.objetivoEstrategicoService.model.descripcion=this.Formgrup.get('descripcion')?.value
    this.objetivoEstrategicoService.model.perspectivaId =this.Formgrup.get('perspectivaId')?.value

    this.objetivosPorAnos = this.objetivosFormArray.value
    
    // actualiza el objetivoExtrategicoId con this.objetivoEstrategicoService.model.id
    if (await this.objetivoEstrategicoService.grabar()) {
      this.objetivosPorAnos.map(obj => {
        obj.objetivoExtrategicoId=this.objetivoEstrategicoService.model.id;
      })
      // manda a grabar el array 
      console.log('objetivoestragicoAno a grabar',this.objetivosPorAnos )
      this.objetivoestragicoAno.insertarray(this.objetivosPorAnos).subscribe({
        next: (response:IObjetivoExtrategicoAno[]) => {
        this.objetivosPorAnos = response
      }
      })
      this.dialogRef.close(this.objetivoEstrategicoService.model);
    }}else {
      this.datosService.showMessage('Error al grabar el objetivo',this.objetivoEstrategicoService.titulomensage,'error')
    }
  }
  cancelar() {
    this.dialogRef.close();
  }
}
