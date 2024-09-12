import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { FormEvaluationEmployeComponent } from '../../Forms/FormEvaluationEmploye/FormEvaluationEmploye.component';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';

@Component({
  selector: 'app-card-empleado',
  standalone: true,
  imports: [FormsModule, CommonModule,MatDialogModule],
  templateUrl: './card-empleado.component.html',
  styleUrls: ['./card-empleado.component.css']
})
export class CardEmpleadoComponent implements OnInit {
 
  constructor(private cdr: ChangeDetectorRef,
    private toastr: MatDialog,) {}

  @Input() empleado: IEmpleado = {
    secuencial: 0,
    codigousuario: '',
    nombreunido: '',
    identificacion: '',
    sdept: 0,
    departamento: '',
    codigoestado: '',
    scargo: 0,
    cargo: '',
    esjefatura: 0,
    tienejefe: 0,
    nivel: 0,
    fechapostulacion: "",
    jefeinmediatO_SECUENCIAL: 0,
    jefeinmediato: ''
  }
  @Input() periodo!:IPeriodo
  @Input() llamarevaluacion: boolean = false;
  @Output() evaluateEmployee = new EventEmitter<IEmpleado>();

  public nfoto: number = 0;
  public foto: string = "";

  ngOnInit(): void {
    this.nfoto = this.empleado.secuencial > 99 ? Math.floor(this.empleado.secuencial/10) : this.empleado.secuencial;
    this.foto = "https://randomuser.me/api/portraits/men/" + this.nfoto.toString() + ".jpg";
    this.cdr.detectChanges();
  }

  openEvaluationForm(): void {
    //this.evaluateEmployee.emit(this.empleado);
    const dialogRef = this.toastr.open(FormEvaluationEmployeComponent,
      {width: '800px',data:{empleado:this.empleado,periodo:this.periodo}}
    );
    dialogRef.afterClosed().subscribe((rep)=>{
      
    }); 
  }

  getButtonStyle(): { [key: string]: string } {
    return {
      'background-color': '#007bff',
      'color': 'white',
      'border': 'none',
      'padding': '10px 20px',
      'border-radius': '5px',
      'cursor': 'pointer',
      'font-weight': 'bold',
      'transition': 'background-color 0.3s ease'
    };
  }
}
