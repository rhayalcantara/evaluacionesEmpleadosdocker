import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardEmpleadoComponent } from "../../ViewEmpleado/card-empleado/card-empleado.component";
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Usuario } from 'src/app/Helpers/Interfaces';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';

@Component({
  selector: 'app-evaluar-subordinados',
  templateUrl: './evaluar-subordinados.component.html',
  styleUrls: ['./evaluar-subordinados.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule,  
    CardEmpleadoComponent] 
})
export class EvaluarSubordinadosComponent implements OnInit {
onDepartamentoChange() {
  throw new Error('Method not implemented.');
}
  periodo:IPeriodo={
    id: 1,
    descripcion: 'Evaluacion de Medio Año 2024',
    fechaInicio: new Date('2024-01-01'),
    fechaFin: new Date('2024-06-30'),
    activa: true,
    estadoid: 0
  }
  public searchTerm: string = '';

  public empleado:IEmpleado={
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
    fechapostulacion: '',
    jefeinmediatO_SECUENCIAL: 0,
    jefeinmediato: ''
  }
  public subordinado:IEmpleado={
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
    fechapostulacion: '',
    jefeinmediatO_SECUENCIAL: 0,
    jefeinmediato: ''
  }
  constructor(public empl:Empleados) {
    this.usuario= JSON.parse(localStorage.getItem('usuario') ?? "")
   }
  public usuario:Usuario
 
  ngOnInit(): void {
    
        // busca el periodo en localstore
        const storedPeriodo = localStorage.getItem("periodo");
        if (storedPeriodo) {
          this.periodo = JSON.parse(storedPeriodo);
        }  

   this.empl.GetByUsuario(this.usuario.codigo).subscribe((rep:IEmpleado)=>{
      this.empl.model=rep
      this.empl.getsubordinados(this.periodo)
      this.empleado=rep
          
   })
  }
  searchSubordinados(): void {
    if (!this.searchTerm.trim()) {
      this.empl.getsubordinados(this.periodo)
      //this.empl.arraymodelsubordinados;
    } else {
      this.empl.arraymodelsubordinados = this.empl.arraymodelsubordinados.filter(subordinado =>
        subordinado.nombreunido.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        subordinado.departamento.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        subordinado.cargo.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }
}
