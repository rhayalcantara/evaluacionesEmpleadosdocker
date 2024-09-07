import { Component, OnInit } from '@angular/core';
import { Empleados } from 'src/app/Controllers/Empleados';
import { TableResponse, Usuario } from 'src/app/Helpers/Interfaces';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  
  public term: string='';
  public campos:string[]=[
    '#',
    'Descripcion',
    'Cantidad   ',
    'Unidad     '
    ]
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
      nivel: 0
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
  constructor(private empl:Empleados) {
    this.usuario= JSON.parse(localStorage.getItem('usuario') ?? "")
   }
  public usuario:Usuario
 
  ngOnInit(): void {
    //console.log('usuario',this.usuario)
   this.empl.GetByUsuario(this.usuario.codigo).subscribe((rep:IEmpleado)=>{
      this.empleado=rep
      //console.log('empleado',this.empleado)
   })
 //  console.log("usuario",localStorage.getItem('usuario'))
  }
  onPageChange(event:any){}
  opcion(event:TableResponse){
    console.log(event)
  }
  filter(){
    console.log(this.term)
  }
}
