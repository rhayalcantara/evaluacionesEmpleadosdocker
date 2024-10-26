import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './Services/auth-guard.service';
import { HomeComponent } from './Views/Components/Pages/home/home.component';
import { MetasComponent } from './Views/Components/Pages/metas/metas.component';
import { TiposComponent } from './Views/Components/Pages/tipos/tipos.component';
import { EmpleadosComponent } from './Views/Components/Pages/empleados/empleados.component';
import { PeriodosEvaluacionComponent } from './Views/Components/Pages/periodos-evaluacion/periodos-evaluacion.component';
import { EvaluationPeriodsComponent } from './Views/Components/Pages/evaluation-periods/evaluation-periods.component';
import { GrupoCompetenciasComponent } from './Views/Components/Pages/grupo-competencias/grupo-competencias.component';
import { DashboardComponent } from './Views/Components/Pages/dashboard/dashboard.component';

const routes: Routes = [
  {
    path:'login',
    loadChildren: ()=> 
    import ('loginapp/ComponentLogin').then((m)=>m.ShowmoduleModule)
  },
  { path: 'Home', component: HomeComponent, pathMatch: 'full', canActivate: [AuthGuard] },  
  { path:'Meta', 
    loadComponent:()=> import('./Views/Components/Pages/metas/metas.component')
    .then((m)=> m.MetasComponent),
    canActivate: [AuthGuard]
  },
  { path:'PlanEstrategico', 
    loadComponent:()=> import('./Views/Components/Pages/plan-estrategico/plan-estrategico.component')
    .then((m)=> m.PlanEstrategicoComponent),
    canActivate: [AuthGuard]
  },
  // ... rest of the routes remain unchanged
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
  { path:'Tipo', component: TiposComponent, canActivate: [AuthGuard] },
  { path:'Empleado', component: EmpleadosComponent, canActivate: [AuthGuard] },
  { path:'PeriodoEvaluacion', component: PeriodosEvaluacionComponent, canActivate: [AuthGuard] },
  { path:'PoliticaEvaluacion', 
    loadComponent:()=> import('./Views/Components/Pages/politicas-evaluacion/politicas-evaluacion.component')
    .then((m)=> m.PoliticasEvaluacionComponent),
    canActivate: [AuthGuard]
  },
  { path:'Rol', 
    loadComponent:()=> import('./Views/Components/Pages/roles/roles.component')
    .then((m)=> m.RolesComponent),
    canActivate: [AuthGuard]
  },
  { path:'Evaluacion', 
    loadComponent:()=> import('./Views/Components/Pages/evaluacion/evaluacion.component')
    .then((m)=> m.EvaluacionComponent),
    canActivate: [AuthGuard]
  },
  { path:'EvaluarSubordinados', 
    loadComponent:()=> import('./Views/Components/Pages/evaluar-subordinados/evaluar-subordinados.component')
    .then((m)=> m.EvaluarSubordinadosComponent),
    canActivate: [AuthGuard]
  },
  { path:'evaluation-periods', component: EvaluationPeriodsComponent, canActivate: [AuthGuard] },
  { path:'Estado', 
    loadComponent:()=> import('./Views/Components/Pages/Estado/estado.component')
    .then((m)=> m.EstadoComponent),
    canActivate: [AuthGuard]
  },
  { path:'Perspectiva', 
    loadComponent:()=> import('./Views/Components/Pages/perspectivas/perspectivas.component')
    .then((m)=> m.PerspectivasComponent),
    canActivate: [AuthGuard]
  },
  { path:'supervisor-goals', 
    loadComponent:()=> import('./Views/Components/Pages/supervisor-goals/supervisor-goals.component')
    .then((m)=> m.SupervisorGoalsComponent),
    canActivate: [AuthGuard]
  },
  { path:'Objetivo', 
    loadComponent:()=> import('./Views/Components/Pages/objetivos/objetivos.component')
    .then((m)=> m.ObjetivosComponent),
    canActivate: [AuthGuard]
  },
  { path: 'grupo-competencias', component: GrupoCompetenciasComponent },
  { path:'Excepciones', 
    loadComponent:()=> import('./Views/Components/Pages/excepciones/excepciones.component')
    .then((m)=> m.ExcepcionesComponent),
    canActivate: [AuthGuard]
  },
  { path:'ExcepcionForm', 
    loadComponent:()=> import('./Views/Components/Pages/excepciones/excepciones.component')
    .then((m)=> m.ExcepcionesComponent),
    canActivate: [AuthGuard]
  },
  { path:'ExcepcionSupervisorInmediato', 
    loadComponent:()=> import('./Views/Components/Pages/excepcion-supervisor-inmediato/excepcion-supervisor-inmediato.component')
    .then((m)=> m.ExcepcionSupervisorInmediatoComponent),
    canActivate: [AuthGuard]
  },
  { path: 'dashboard', component: DashboardComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
