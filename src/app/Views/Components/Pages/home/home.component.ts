import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Empleados } from 'src/app/Controllers/Empleados';
import { TableResponse, Usuario } from 'src/app/Helpers/Interfaces';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';

@Component({
  selector: 'app-home',
  standalone:true,
  imports:[FormsModule,CommonModule,CardEmpleadoComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  
  
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
      fechapostulacion: "",
      jefeinmediatO_SECUENCIAL: 0,
      jefeinmediato: ''
    }
   
  public arraydatos:any[]=
  [
    {
      '#':1,
      'Descripcion':'Papel',
      'Cantidad':1,
      'Unidad':'Faldo'
    },
    {
      '#':2,
      'Descripcion':'Cafe',
      'Cantidad':1,
      'Unidad':'Sobre'
    },
    {
      '#':3,
      'Descripcion':'Azucar',
      'Cantidad':1,
      'Unidad':'Libras'
    },
    {
      '#':4,
      'Descripcion':'Agua',
      'Cantidad':1,
      'Unidad':'Botellon'
    }
  ]
  constructor(public empl:Empleados) {
    this.usuario= JSON.parse(localStorage.getItem('usuario') ?? "")
   }
  public usuario:Usuario
 
  ngOnInit(): void {
    
   this.empl.GetByUsuario(this.usuario.codigo).subscribe((rep:IEmpleado)=>{
      this.empl.model=rep
      this.empl.getsubordinados()
      this.empleado=rep
      localStorage.setItem("empleado",JSON.stringify(this.empleado))
      
   })
 
  }
  onPageChange(event:any){}
  opcion(event:TableResponse){
    console.log(event)
  }

}
