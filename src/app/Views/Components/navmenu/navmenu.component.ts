
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonsLibService } from '@commons-lib';
import { Usuario } from 'src/app/Models/Usuario/usuario';

import { MatSidenav } from '@angular/material/sidenav';
import { SegurityService } from 'src/app/Services/segurity.service';

@Component({
  selector: 'app-navmenu',
  templateUrl: './navmenu.component.html',
  styleUrls: ['./navmenu.component.css']
})
export class NavmenuComponent implements OnInit {
  public logg:string = 'Login'
  mostramenu:Boolean=false

 public imagen:any ="assets/user.png"
  usuarioSegurity: any;
  constructor(private router: Router,
              @Inject(CommonsLibService) private commons: CommonsLibService,
              @Inject(SegurityService)  private usuarioservicio:SegurityService
              ) 
  { 
     
      this.commons.mensaje$.subscribe((mess)=>{
        
        
        if (mess=='loguiado'){
          
         //console.log(localStorage.getItem('usuario'))
         this.usuarioservicio.agregarusuario(JSON.parse(localStorage.getItem('usuario') ?? ""))
         //console.log('elsusuario',this.usuarioservicio.usuario)
         
          this.mostramenu=true
          this.router.navigate(['/Home'])
          this.logg='LogOut'
        }
        if (mess=='nologuiado'){
          //console.log('entro en nologiado')
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
    //console.log('entro al navbar')
      this.mostramenu=false
      this.router.navigate(['/login']);
 
    
  }
  log():void{
   // console.log(this.logg)
    if (this.logg!='LogOut'){
              
        this.logg= 'LogOut'

        this.mostramenu=true
       // this.router.navigate(['/login'])
    }else{
      
        this.logg= 'Login'
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
        localStorage.removeItem('empleado');
       
      this.mostramenu=false
       this.router.navigate(['/login']);
    }
}


}
