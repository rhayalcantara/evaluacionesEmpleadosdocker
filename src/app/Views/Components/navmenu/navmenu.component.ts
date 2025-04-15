
import { ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonsLibService } from '@commons-lib';
import { Usuario } from 'src/app/Models/Usuario/usuario';

import { MatSidenav } from '@angular/material/sidenav';
import { SegurityService } from 'src/app/Services/segurity.service';
import { EmpleadoRol } from 'src/app/Controllers/EmpleadoRol';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { IEmpleadoRol } from 'src/app/Models/Rol/IRol';
import { Empleados } from 'src/app/Controllers/Empleados';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { Periodos } from 'src/app/Controllers/Periodos';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { IConsejal } from 'src/app/Models/Consejal/Iconsejal';

@Component({
  selector: 'app-navmenu',
  templateUrl: './navmenu.component.html',
  styleUrls: ['./navmenu.component.css']
})
export class NavmenuComponent implements OnInit {
  public logg:string = 'Login'
  public mostramenu:Boolean=false
  public periodo:IPeriodo = this.peri.inicializamodelo()
  public empleado:IEmpleado=this.empl.inicializamodelo()
  public imagen:any ="assets/user.png"
  usuarioSegurity: any;
  constructor(private router: Router,
              private empl:Empleados,
              private peri:Periodos,
              private cd: ChangeDetectorRef,
              public empleadoRolController:EmpleadoRol,
              @Inject(CommonsLibService) private commons: CommonsLibService,
              @Inject(SegurityService)  private usuarioservicio:SegurityService
              ) 
  { 
     
      this.commons.mensaje$.subscribe((mess)=>{
        
        
        if (mess=='loguiado'){
          let tipousario = localStorage.getItem('tipodeusuario')      
          if (tipousario=='consejal'){
            let consejal:IConsejal = JSON.parse(localStorage.getItem('consejal') ?? "")
            // console.log('consejal',consejal)
                      //busca el periodo activo
          this.peri.GetActivo().subscribe((rep:IPeriodo)=>{           
            this.periodo=rep;
            //actualiza el periodo activo en memoria
            // Suggestion: Consider using HttpOnly cookies for storing sensitive information like authentication tokens.
            // Review all localStorage usage and determine if the data being stored is sensitive and if there are alternative, more secure ways to store it.
            // Consider using a dedicated state management library like NgRx or Akita for managing application state.
            localStorage.setItem("periodo", JSON.stringify(this.periodo))
            // busca el empleado
            this.router.navigate(['/consejal/evaluacion/', JSON.stringify(consejal)]);
           })
          }else{
              //// console.log(localStorage.getItem('usuario'))
              this.usuarioservicio.agregarusuario(JSON.parse(localStorage.getItem('usuario') ?? ""))         
              //busca el periodo activo
              this.peri.GetActivo().subscribe((rep:IPeriodo)=>{
                
                this.periodo=rep;
                //actualiza el periodo activo en memoria
                // Suggestion: Consider using HttpOnly cookies for storing sensitive information like authentication tokens.
                // Review all localStorage usage and determine if the data being stored is sensitive and if there are alternative, more secure ways to store it.
                // Consider using a dedicated state management library like NgRx or Akita for managing application state.
                localStorage.setItem("periodo", JSON.stringify(this.periodo))
                // busca el empleado
                this.empl.GetByUsuario(this.usuario.codigo).subscribe((rep: IEmpleado) => {
                  this.empl.model = rep
                  this.empl.getsubordinados(this.periodo)
                  this.empleado = rep
                  //actualiza el empleado en memoria
                  // Suggestion: Consider using HttpOnly cookies for storing sensitive information like authentication tokens.
                  // Review all localStorage usage and determine if the data being stored is sensitive and if there are alternative, more secure ways to store it.
                  // Consider using a dedicated state management library like NgRx or Akita for managing application state.
                  localStorage.setItem("empleado", JSON.stringify(this.empleado))
                  //busca el rol del empleado
                  this.buscarEmpleadoRol()
                })
        }
          
        );

          this.mostramenu=true
          this.router.navigate(['Home'])
          this.logg='LogOut'
        }
      }
        if (mess=='nologuiado'){
          //// console.log('entro en nologiado')
          this.mostramenu=false
          this.logg='Login'
          this.router.navigate(['login'])
        }
        if (mess=='nuevousuario'){
          this.mostramenu=false
          this.logg='Login'
          this.router.navigate(['login'])
          
        }
      })
  }

  buscarEmpleadoRol() {
    //buscar empleadorol en el controlador
    this.empleadoRolController.Gets().subscribe(
        {
            next:(rep:ModelResponse) => {
                let empleadorol: IEmpleadoRol[] = rep.data;
                let elemprol: IEmpleadoRol | undefined = empleadorol.find(x => x.empleadoSecuencial == this.empleado.secuencial);
                if (elemprol) {
                    this.empleadoRolController.model = elemprol;
                    // Suggestion: Consider using HttpOnly cookies for storing sensitive information like authentication tokens.
                    // Review all localStorage usage and determine if the data being stored is sensitive and if there are alternative, more secure ways to store it.
                    // Consider using a dedicated state management library like NgRx or Akita for managing application state.
                    localStorage.setItem("rol", JSON.stringify(this.empleadoRolController.model))
                }
            }
        })
}

  precionado(){
    //this.isExpanded = false;
    let element: HTMLElement = document.getElementsByClassName('navbar-toggler')[0] as HTMLElement;      
        if ( element.getAttribute( 'aria-expanded' ) == 'true' ) {
        element.click();
    }
    
  }
  get usuario(){return this.usuarioservicio.usuario}
  Logout(){
    let usuario:Usuario = {
      codigo:'',
      nombre:'',
      emailinterno:'',
      esnulo:0,
      verificado:0,
      identificacion:'',
      menuhome:0
    }
    this.usuarioSegurity.agregarusuario (usuario)

  }
  ngOnInit(): void {
    //// console.log('entro al navbar')
      this.mostramenu=false
      this.router.navigate(['login']);
 
    
  }
  log():void{
   // // console.log(this.logg)
  /*  if (this.logg!='LogOut'){
              
        this.logg= 'LogOut'

        this.mostramenu=true
        this.router.navigate(['login'])
    }else{
      */
        this.logg= 'Login'
        localStorage.removeItem('empleado');
        localStorage.removeItem('periodo');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('tipodeusuario')
        let tipodeusuario = localStorage.getItem('tipodeusuario')
        if (tipodeusuario=='consejal'){
          localStorage.removeItem('consejal')          
        }else{
          localStorage.removeItem('rol');       
        }
        this.mostramenu=false        
        this.router.navigate(['login']);
        this.cd.detectChanges();
   // }
}


}
