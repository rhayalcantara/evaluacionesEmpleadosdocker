import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './Services/auth-guard.service';
import { HomeComponent } from './Views/Components/Pages/home/home.component';
import { MetasComponent } from './Views/Components/Pages/metas/metas.component';
import { TiposComponent } from './Views/Components/Pages/tipos/tipos.component';
import { EmpleadosComponent } from './Views/Components/Pages/empleados/empleados.component';
import { PeriodosEvaluacionComponent } from './Views/Components/Pages/periodos-evaluacion/periodos-evaluacion.component';

const routes: Routes = [
  {
    path:'login',
    loadChildren: ()=> 
    import ('loginapp/ComponentLogin').then((m)=>m.ShowmoduleModule)
  },
  { path: 'Home',       component:  HomeComponent,            pathMatch: 'full' , canActivate: [AuthGuard] },  

  { path:'Meta', 
    loadComponent:()=> import('./Views/Components/Pages/metas/metas.component')
    .then((m)=> m.MetasComponent),
     canActivate: [AuthGuard]
  },
  { path:'Departamento', 
    loadComponent:()=> import('./Views/Components/Pages/departamentos/departamentos.component')
    .then((m)=> m.DepartamentosComponent),
     canActivate: [AuthGuard]
  },
  { path:'Puesto', 
    loadComponent:()=> import('./Views/Components/Pages/puestos/puestos.component')
    .then((m)=> m.PuestosComponent),
     canActivate: [AuthGuard]
  },
  { path:'Periodo', 
    loadComponent:()=> import('./Views/Components/Pages/periodos/periodos.component')
    .then((m)=> m.PeriodosComponent),
     canActivate: [AuthGuard]
  },
  { path:'Tipo', 
    component: TiposComponent,
    canActivate: [AuthGuard]
  },
  { path:'Empleado', 
    component: EmpleadosComponent,
    canActivate: [AuthGuard]
  },
  { path:'PeriodoEvaluacion', 
    component: PeriodosEvaluacionComponent,
    canActivate: [AuthGuard]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }